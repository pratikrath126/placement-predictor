import { useState, useEffect } from 'react'

function ModelInfo({ modelInfo }) {
    const [featureData, setFeatureData] = useState([])

    // Model comparison data (from actual training results - v2)
    // SVM selected as best model (94.3% accuracy) - excludes overfitted tree models
    const models = [
        { name: 'SVM', accuracy: 94.3, precision: 88.16, recall: 77.46, f1: 82.46, rocAuc: 97.84, best: true },
        { name: 'K-Nearest Neighbors', accuracy: 90.2, precision: 79.07, recall: 58.96, f1: 67.55, rocAuc: 92.41, best: false },
        { name: 'Logistic Regression', accuracy: 89.1, precision: 71.92, recall: 60.69, f1: 65.83, rocAuc: 93.55, best: false }
    ]

    // Feature importance (based on data correlation analysis)
    const featureImportance = [
        { name: 'Backlogs', value: 40.1, note: '(most impactful)' },
        { name: 'CGPA', value: 27.9, note: '' },
        { name: 'Technical Skill Score', value: 24.7, note: '' },
        { name: 'Soft Skill Score', value: 19.8, note: '' },
        { name: 'Internship Count', value: 3.5, note: '' },
        { name: 'Work Experience', value: 2.2, note: '' },
        { name: 'HSC Percentage', value: 1.7, note: '' }
    ]

    useEffect(() => {
        const timer = setTimeout(() => {
            setFeatureData(featureImportance)
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <section id="model">
            <div className="section-header">
                <h2>Model Performance</h2>
                <p>
                    Comparison of machine learning algorithms trained on 5,000 student records.
                </p>
            </div>

            <div className="model-container">
                {/* Best Model Highlight */}
                <div className="model-highlight">
                    <h3>🏆 Best Performing Model</h3>
                    <p className="accuracy">SVM (Support Vector Machine)</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
                        94.3% Accuracy | 82.46% F1-Score | 97.84% ROC-AUC
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '5px', fontSize: '0.9rem' }}>
                        Selected as best model after excluding overfitted tree-based models
                    </p>
                </div>

                {/* Model Comparison Table */}
                <table className="model-table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Accuracy</th>
                            <th>Precision</th>
                            <th>Recall</th>
                            <th>F1-Score</th>
                            <th>ROC-AUC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map((model, idx) => (
                            <tr key={idx} className={model.best ? 'best-row' : ''}>
                                <td>
                                    {model.best && <span style={{ marginRight: '8px' }}>🏆</span>}
                                    {model.name}
                                </td>
                                <td>{model.accuracy}%</td>
                                <td>{model.precision}%</td>
                                <td>{model.recall}%</td>
                                <td>{model.f1}%</td>
                                <td>{model.rocAuc}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '15px',
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                }}>
                    * Tree-based models (Random Forest, Gradient Boosting) excluded due to overfitting
                </p>

                {/* Feature Importance */}
                <div className="feature-importance">
                    <h3 style={{ marginBottom: '30px', fontSize: '1.5rem' }}>
                        📊 Key Factors Affecting Placement
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '0.9rem' }}>
                        Based on correlation analysis of 5,000 student records
                    </p>
                    {featureData.map((feature, idx) => (
                        <div className="feature-bar" key={idx}>
                            <span className="feature-name">
                                {feature.name}
                                {feature.note && <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}> {feature.note}</span>}
                            </span>
                            <div className="feature-bar-container">
                                <div
                                    className="feature-bar-fill"
                                    style={{
                                        width: `${(feature.value / 45) * 100}%`,
                                        background: feature.name === 'Backlogs'
                                            ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                            : 'linear-gradient(90deg, var(--gradient-start), var(--gradient-mid))'
                                    }}
                                ></div>
                            </div>
                            <span className="feature-value">{feature.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ModelInfo
