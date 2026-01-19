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
    priority_order = {"Very High": 0, "High": 1, "Medium": 2, "Low": 3}
    suggestions.sort(key=lambda x: priority_order.get(x["priority"], 4))
    
    return suggestions, strengths

def generate_suggestions(input_data: PredictionInput, is_placed: bool):
    """Generate personalized suggestions based on strict CSE placement reality"""
    suggestions = []
    strengths = []
    
    # 1. Backlogs (CRITICAL)
    if input_data.backlogs > 0:
        suggestions.append({
            "area": "Academics",
            "priority": "Very High",
            "message": f"You have {input_data.backlogs} active backlog(s). Most companies will inherently reject profiles with backlogs. Clear them immediately!",
            "impact": "Critical"
        })
    else:
        strengths.append("Clean Academic Record (No Backlogs)")

    # 2. Internships (CRITICAL - "Real World Experience")
    if input_data.internship_count == 0:
        suggestions.append({
            "area": "Practical Experience",
            "priority": "High", # User emphasized this
            "message": "You have 0 internships. In CSE, hands-on industry experience is often valued more than grades. Try to secure at least one internship.",
            "impact": "Very High"
        })
    elif input_data.internship_count >= 2:
        strengths.append(f"Strong Industry Exposure ({input_data.internship_count} internships)")

    # 3. Live Projects (High Importance)
    if input_data.live_projects < 2:
        suggestions.append({
            "area": "Projects",
            "priority": "High",
            "message": "Build more full-stack or ML projects (hosted on GitHub). Recruiters look for proof of coding skills.",
            "impact": "High"
        })
    else:
        strengths.append(f"Good Project Portfolio ({input_data.live_projects} projects)")

    # 4. Technical Skills
    if input_data.technical_skill_score < 75:
        suggestions.append({
            "area": "Technical Skills",
            "priority": "High",
            "message": "Your technical assessment score is low. Focus on DSA (Data Structures & Algorithms) and core CS concepts.",
            "impact": "High"
        })
    elif input_data.technical_skill_score >= 90:
        strengths.append(f"Excellent Technical Proficiency ({input_data.technical_skill_score}/100)")

    # 5. CGPA
    if input_data.cgpa < 7.5:
        suggestions.append({
            "area": "CGPA",
            "priority": "Medium",
            "message": "Your CGPA is on the lower side. While skills matter more, a 7.5+ is safe for all eligibility criteria.",
            "impact": "Medium"
        })
    elif input_data.cgpa >= 8.5:
        strengths.append(f"Strong Academic performance ({input_data.cgpa} CGPA)")

    # 6. Extracurriculars (Low Importance)
    if input_data.extracurricular_activities == 'No':
        # Only suggest if profile is seemingly empty otherwise
        if input_data.internship_count == 0 and input_data.live_projects == 0:
            suggestions.append({
                "area": "Extracurriculars",
                "priority": "Low",
                "message": "Consider some non-academic activities to show personality, but prioritize coding first.",
                "impact": "Low"
            })
    
    return suggestions, strengths

def calculate_heuristic_score(input_data: PredictionInput) -> float:
    """
    Calculate a deterministic score based on 'CSE Reality' rules and weights.
    V5 Update: Lower baseline (60), stricter skill penalties, rounded output.
    """
    score = 60.0 # Baseline (Average candidate with basic stats)
    
    # 1. Backlogs (The Killer)
    if input_data.backlogs > 0:
        score -= (30 + (input_data.backlogs * 10)) # Immediate drop to <30
        return max(0.0, score) # Return early/low for backlogs

    # 2. CGPA (Scale relative to 7.0)
    # Range 7.0 to 10.0 -> add up to 15 points
    if input_data.cgpa >= 7.0:
        points = (input_data.cgpa - 7.0) * 5 # e.g. 7.5 -> +2.5. 9.0 -> +10.
        score += points
    else:
        score -= 20 # Drop significantly if < 7.0 (Eligibility risk)

    # 3. Technical Skills (Threshold based)
    # Baseline expectation is 75. Bonus above, penalty below.
    if input_data.technical_skill_score >= 75:
        tech_points = (input_data.technical_skill_score - 75) * 0.4
        score += tech_points
    else:
        # Penalty for being below average technical skill
        penalty = (75 - input_data.technical_skill_score) * 0.5
        score -= penalty

    # 4. Internships (The "Job Ready" Factor)
    if input_data.internship_count > 0:
        score += (input_data.internship_count * 10) # 1 internship = +10. 2 = +20.
    else:
        score -= 5 # Minor penalty, but missing out on huge bonus

    # 5. Projects
    if input_data.live_projects > 0:
        score += (input_data.live_projects * 5)

    # 6. Extracurriculars (Tie-breaker only)
    if input_data.extracurricular_activities == 'Yes':
        score += 2

    # Final Clamp
    return max(10.0, min(99.0, score))

@app.get("/")
async def root():
    return {"message": "Welcome to Placement Predictor API", "status": "active"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: PredictionInput):
    try:
        # Calculate strict score
        final_score = calculate_heuristic_score(input_data)
        
        # Round to 1 decimal place to avoid "78.0000001"
        final_score = round(final_score, 1)
        
        # Determine status
        is_placed = final_score >= 60.0 # Strict passing measure
        result = "Placed" if is_placed else "Not Placed"
        
        # Generate suggestions
        suggestions, strengths = generate_suggestions(input_data, is_placed)
        
        return PredictionResponse(
            prediction=result,
            probability=final_score, # Clean rounded score
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
