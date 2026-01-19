"""
Machine Learning Model Training Pipeline for Placement Prediction
Following the approach from peer's notebook: student-placement-89-beats-regression.ipynb

Key differences from previous version:
- Uses pd.get_dummies() for categorical encoding (matches peer's approach)
- Drops salary_package_lpa (it would cause data leakage)
- Expected accuracy: ~89% for Logistic Regression (as per peer's results)
"""

import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
import pickle
import json
import warnings
warnings.filterwarnings('ignore')

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_and_preprocess_data():
    """Load and preprocess the dataset following peer's approach"""
    filepath = os.path.join(PROJECT_ROOT, 'data', 'student_academic_placement_performance_dataset.csv')
    df = pd.read_csv(filepath)
    
    print(f"   Loaded dataset with {len(df)} records and {len(df.columns)} columns")
    print(f"   Columns: {list(df.columns)}")
    
    # Following peer's approach: Drop student_id, placement_status, and salary_package_lpa
    # salary_package_lpa would cause data leakage (only placed students have salary > 0)
    X = df.drop(columns=['student_id', 'placement_status', 'salary_package_lpa'])
    y = df['placement_status']
    
    # Use get_dummies for categorical encoding (peer's approach)
    X = pd.get_dummies(X, drop_first=True)
    
    feature_cols = list(X.columns)
    
    print(f"   Features after encoding: {len(feature_cols)}")
    print(f"   Target distribution: Placed={sum(y)}, Not Placed={len(y)-sum(y)}")
    
    return X, y, feature_cols, df

def train_and_evaluate_models(X_train, X_test, y_train, y_test):
    """Train multiple models and evaluate performance"""
    
    # Initialize models with regularization to prevent overfitting
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42),
        'SVM': SVC(kernel='rbf', probability=True, C=1.0, random_state=42),
        'K-Nearest Neighbors': KNeighborsClassifier(n_neighbors=7)
    }
    
    results = []
    trained_models = {}
    
    print("\n" + "="*80)
    print("MODEL TRAINING AND EVALUATION")
    print("="*80)
    
    for name, model in models.items():
        print(f"\n📊 Training {name}...")
        
        # Train model
        model.fit(X_train, y_train)
        trained_models[name] = model
        
        # Predictions
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob)
        
        # Cross-validation score
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
        
        results.append({
            'Model': name,
            'Accuracy': round(accuracy * 100, 2),
            'Precision': round(precision * 100, 2),
            'Recall': round(recall * 100, 2),
            'F1-Score': round(f1 * 100, 2),
            'ROC-AUC': round(roc_auc * 100, 2),
            'CV Mean': round(cv_scores.mean() * 100, 2),
            'CV Std': round(cv_scores.std() * 100, 2)
        })
        
        print(f"   ✅ Accuracy: {accuracy*100:.2f}%")
        print(f"   ✅ F1-Score: {f1*100:.2f}%")
        print(f"   ✅ ROC-AUC: {roc_auc*100:.2f}%")
        
        if name == 'Logistic Regression':
            print(f"\n   Classification Report for {name}:")
            print(classification_report(y_test, y_pred))
    
    return results, trained_models

def get_feature_importance(model, feature_cols, model_name):
    """Extract feature importance from the model"""
    importance = {}
    
    if hasattr(model, 'feature_importances_'):
        importance = dict(zip(feature_cols, model.feature_importances_))
    elif hasattr(model, 'coef_'):
        importance = dict(zip(feature_cols, np.abs(model.coef_[0])))
    
    # Sort by importance
    importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
    return importance

def main():
    print("\n🎓 PLACEMENT PREDICTOR - MODEL TRAINING PIPELINE (v2)")
    print("   Following peer's notebook approach")
    print("="*80)
    
    # Load and preprocess data
    print("\n📁 Loading dataset...")
    X, y, feature_cols, df = load_and_preprocess_data()
    print(f"   Dataset shape: {X.shape}")
    print(f"   Features: {len(feature_cols)}")
    
    # Split data (same as peer's notebook: 80/20 split with stratify)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Scale features (same as peer's notebook)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train and evaluate models
    results, trained_models = train_and_evaluate_models(
        X_train_scaled, X_test_scaled, y_train, y_test
    )
    
    # Create results DataFrame
    results_df = pd.DataFrame(results)
    print("\n" + "="*80)
    print("📈 MODEL COMPARISON RESULTS")
    print("="*80)
    print(results_df.to_string(index=False))
    
    # Exclude overfitted tree-based models (Random Forest, Gradient Boosting get 100% accuracy)
    # Select best model from remaining models based on F1-Score
    excluded_models = ['Random Forest', 'Gradient Boosting']
    filtered_df = results_df[~results_df['Model'].isin(excluded_models)]
    
    best_idx = filtered_df['F1-Score'].idxmax()
    best_model_name = results_df.loc[best_idx, 'Model']
    best_model = trained_models[best_model_name]
    
    print(f"\n🏆 BEST MODEL: {best_model_name}")
    print(f"   Accuracy: {results_df.loc[best_idx, 'Accuracy']}%")
    print(f"   F1-Score: {results_df.loc[best_idx, 'F1-Score']}%")
    print(f"   ROC-AUC: {results_df.loc[best_idx, 'ROC-AUC']}%")
    
    # Get feature importance
    feature_importance = get_feature_importance(best_model, feature_cols, best_model_name)
    print("\n📊 Feature Importance (Top 10):")
    for i, (feat, imp) in enumerate(list(feature_importance.items())[:10]):
        print(f"   {i+1}. {feat}: {imp:.4f}")
    
    # Save the best model and artifacts
    print("\n💾 Saving model and artifacts...")
    
    model_dir = os.path.join(PROJECT_ROOT, 'model')
    os.makedirs(model_dir, exist_ok=True)
    
    # Save model
    with open(os.path.join(model_dir, 'best_model.pkl'), 'wb') as f:
        pickle.dump(best_model, f)
    
    # Save scaler
    with open(os.path.join(model_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    
    # Save feature columns for prediction
    with open(os.path.join(model_dir, 'feature_cols.pkl'), 'wb') as f:
        pickle.dump(feature_cols, f)
    
    # Save model info and results
    model_info = {
        'best_model': best_model_name,
        'feature_cols': feature_cols,
        'results': results,
        'feature_importance': {k: float(v) for k, v in feature_importance.items()},
        'accuracy': float(results_df.loc[best_idx, 'Accuracy']),
        'f1_score': float(results_df.loc[best_idx, 'F1-Score']),
        'roc_auc': float(results_df.loc[best_idx, 'ROC-AUC'])
    }
    
    with open(os.path.join(model_dir, 'model_info.json'), 'w') as f:
        json.dump(model_info, f, indent=2)
    
    # Save results CSV
    results_df.to_csv(os.path.join(model_dir, 'model_comparison.csv'), index=False)
    
    print("   ✅ Saved: model/best_model.pkl")
    print("   ✅ Saved: model/scaler.pkl")
    print("   ✅ Saved: model/feature_cols.pkl")
    print("   ✅ Saved: model/model_info.json")
    print("   ✅ Saved: model/model_comparison.csv")
    
    print("\n✨ Training pipeline completed successfully!")
    print("="*80)

if __name__ == "__main__":
    main()
