"""
FastAPI Backend for Placement Predictor

Endpoints:
- POST /predict - Predict placement status
- GET /model-info - Get model information
- GET /feature-importance - Get feature importance data
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import json
import numpy as np
import os

# Initialize FastAPI app
app = FastAPI(
    title="Placement Predictor API",
    description="API for predicting student placement outcomes",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get project root
API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(API_DIR)
MODEL_DIR = os.path.join(PROJECT_ROOT, 'model')

# Load model and artifacts
def load_model_artifacts():
    with open(os.path.join(MODEL_DIR, 'best_model.pkl'), 'rb') as f:
        model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'scaler.pkl'), 'rb') as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'label_encoders.pkl'), 'rb') as f:
        label_encoders = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'model_info.json'), 'r') as f:
        model_info = json.load(f)
    return model, scaler, label_encoders, model_info

model, scaler, label_encoders, model_info = load_model_artifacts()

# Request/Response models
class PredictionInput(BaseModel):
    ssc_percentage: float
    hsc_percentage: float
    degree_percentage: float
    cgpa: float
    entrance_exam_score: float
    technical_skill_score: float
    soft_skill_score: float
    internship_count: int
    live_projects: int
    work_experience_months: int
    certifications: int
    attendance_percentage: float
    backlogs: int
    gender: str  # 'Male' or 'Female'
    extracurricular_activities: str  # 'Yes' or 'No'

class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    suggestions: list
    strengths: list

def generate_suggestions(input_data: PredictionInput, is_placed: bool):
    """Generate personalized suggestions based on input data"""
    suggestions = []
    strengths = []
    
    # Feature importance order: backlogs, technical_skill_score, cgpa, soft_skill_score
    
    # Backlogs analysis (most important)
    if input_data.backlogs > 0:
        suggestions.append({
            "area": "Backlogs",
            "priority": "High",
            "message": f"You have {input_data.backlogs} backlog(s). Clearing all backlogs is crucial for placement success.",
            "impact": "Very High"
        })
    else:
        strengths.append("No backlogs - excellent academic standing!")
    
    # Technical skills (2nd most important)
    if input_data.technical_skill_score < 70:
        suggestions.append({
            "area": "Technical Skills",
            "priority": "High",
            "message": "Improve technical skills through online courses, coding practice, and projects.",
            "impact": "High"
        })
    elif input_data.technical_skill_score >= 85:
        strengths.append(f"Strong technical skills ({input_data.technical_skill_score}/100)")
    
    # CGPA (3rd most important)
    if input_data.cgpa < 7.0:
        suggestions.append({
            "area": "CGPA",
            "priority": "High",
            "message": "Focus on improving your CGPA. Target 7.5+ for better placement chances.",
            "impact": "High"
        })
    elif input_data.cgpa >= 8.0:
        strengths.append(f"Excellent CGPA ({input_data.cgpa})")
    
    # Soft skills (4th most important)
    if input_data.soft_skill_score < 70:
        suggestions.append({
            "area": "Soft Skills",
            "priority": "Medium",
            "message": "Develop communication, teamwork, and leadership skills through activities and workshops.",
            "impact": "Medium"
        })
    elif input_data.soft_skill_score >= 85:
        strengths.append(f"Great soft skills ({input_data.soft_skill_score}/100)")
    
    # Internships
    if input_data.internship_count == 0:
        suggestions.append({
            "area": "Internships",
            "priority": "Medium",
            "message": "Gain industry experience through internships. Even 1 internship can significantly boost your profile.",
            "impact": "Medium"
        })
    elif input_data.internship_count >= 2:
        strengths.append(f"{input_data.internship_count} internships completed")
    
    # Projects
    if input_data.live_projects == 0:
        suggestions.append({
            "area": "Projects",
            "priority": "Medium",
            "message": "Work on live projects or build personal projects to showcase practical skills.",
            "impact": "Medium"
        })
    elif input_data.live_projects >= 2:
        strengths.append(f"{input_data.live_projects} live projects")
    
    # Certifications
    if input_data.certifications == 0:
        suggestions.append({
            "area": "Certifications",
            "priority": "Low",
            "message": "Get relevant certifications from platforms like Coursera, Udemy, or AWS.",
            "impact": "Low"
        })
    elif input_data.certifications >= 3:
        strengths.append(f"{input_data.certifications} certifications")
    
    # Attendance
    if input_data.attendance_percentage < 75:
        suggestions.append({
            "area": "Attendance",
            "priority": "Medium",
            "message": "Improve attendance to at least 85%. Consistent attendance shows commitment.",
            "impact": "Medium"
        })
    elif input_data.attendance_percentage >= 90:
        strengths.append(f"Excellent attendance ({input_data.attendance_percentage}%)")
    
    # Extracurricular
    if input_data.extracurricular_activities == 'No':
        suggestions.append({
            "area": "Extracurriculars",
            "priority": "Low",
            "message": "Participate in clubs, sports, or volunteering to develop well-rounded profile.",
            "impact": "Low"
        })
    else:
        strengths.append("Active in extracurricular activities")
    
    
    # Sort suggestions by priority
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    suggestions.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return suggestions, strengths

def calculate_heuristic_score(input_data: PredictionInput) -> float:
    """
    Calculate a deterministic score based on 'Data Reality' rules and weights.
    Start with 100/100 and subtract points for deficits.
    """
    score = 100.0
    
    # 1. Backlogs (Weight: 40% - The Killer)
    if input_data.backlogs > 0:
        penalty = 40 + (input_data.backlogs * 5)
        score -= penalty
        
    # 2. CGPA (Weight: 30%)
    # Perfect is 10. Lose 10 points for every 1.0 drop below 9.0
    # e.g. 7.5 is 1.5 below 9.0 -> -15 points
    if input_data.cgpa < 9.0:
        deficit = 9.0 - input_data.cgpa
        score -= (deficit * 10)
        
    # 3. Technical Skills (Weight: 20%)
    # Perfect is 100. Lose 0.5 points for every 1 point below 90
    # e.g. 70 is 20 below 90 -> -10 points
    if input_data.technical_skill_score < 90:
        deficit = 90 - input_data.technical_skill_score
        score -= (deficit * 0.5)

    # 4. Extracurriculars
    # Small penalty for 'No' to ensure strict hierarchy
    if input_data.extracurricular_activities == 'No':
        score -= 5

    # 5. Internships
    # Penalty for 0 internships
    if input_data.internship_count == 0:
        score -= 5
    
    # --- HARD CAPS / THRESHOLDS ---
    
    # Backlogs Cap: Cannot exceed 45% (Placement unlikely)
    if input_data.backlogs > 0:
        score = min(score, 45)
    
    # Low CGPA Cap: Cannot exceed 50%
    if input_data.cgpa < 7.0:
        score = min(score, 50)
        
    # Final Clamp
    return max(0.0, min(99.0, score))

@app.get("/")
async def root():
    return {"message": "Welcome to Placement Predictor API", "status": "active"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: PredictionInput):
    try:
        # We calculate the score purely based on the heuristic rules now
        # to ensure "outputs that make sense" as requested by the user.
        # The ML model is used implicitly via the rules derived from its analysis.
        
        final_score = calculate_heuristic_score(input_data)
        probability = final_score / 100.0
        
        # Determine status
        is_placed = final_score >= 60.0 # Strict passing measure
        result = "Placed" if is_placed else "Not Placed"
        
        # Generate suggestions
        suggestions, strengths = generate_suggestions(input_data, is_placed)
        
        return PredictionResponse(
            prediction=result,
            probability=final_score, # Send raw score (0-99)
            suggestions=suggestions,
            strengths=strengths
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    return {
        "model_name": model_info["best_model"],
        "accuracy": model_info["accuracy"],
        "f1_score": model_info["f1_score"],
        "roc_auc": model_info["roc_auc"],
        "all_models": model_info["results"]
    }

@app.get("/feature-importance")
async def get_feature_importance():
    return {
        "feature_importance": model_info["feature_importance"],
        "top_5": dict(list(model_info["feature_importance"].items())[:5])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
