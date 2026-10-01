import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import CareerRoadmapRecord, ResumeRecord
from services.ai_service import AIService

logger = logging.getLogger("guidance_router")
router = APIRouter(prefix="/api/guidance", tags=["Career Guidance"])

POPULAR_ROLES = [
    {
        "id": "fullstack",
        "title": "Senior Full-Stack Engineer",
        "description": "Architects modern end-to-end web apps, microservices, and distributed cloud systems.",
        "avg_salary": "$135,000 - $185,000",
        "demand": "Very High",
        "key_skills": ["React", "TypeScript", "Node.js", "SQL", "AWS", "Docker", "System Design"]
    },
    {
        "id": "aiml",
        "title": "AI & Machine Learning Engineer",
        "description": "Builds and deploys generative AI models, deep learning pipelines, RAG, and MLOps.",
        "avg_salary": "$145,000 - $210,000",
        "demand": "Extremely High",
        "key_skills": ["Python", "PyTorch", "LLM", "RAG", "Docker", "FastAPI", "Vector DB"]
    },
    {
        "id": "devops",
        "title": "Cloud & DevOps Architect",
        "description": "Orchestrates multi-cloud Kubernetes clusters, automated CI/CD, and infrastructure as code.",
        "avg_salary": "$140,000 - $190,000",
        "demand": "Very High",
        "key_skills": ["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD", "Linux", "Grafana"]
    },
    {
        "id": "data_engineer",
        "title": "Data Platform Engineer",
        "description": "Designs real-time and batch distributed data pipelines, lakehouses, and analytics platforms.",
        "avg_salary": "$130,000 - $175,000",
        "demand": "High",
        "key_skills": ["Python", "SQL", "Apache Spark", "Kafka", "Snowflake", "Airflow", "PostgreSQL"]
    },
    {
        "id": "product_engineer",
        "title": "Staff Product Engineer / Tech Lead",
        "description": "Drives engineering strategy, customer-centric architecture, and cross-team mentorship.",
        "avg_salary": "$160,000 - $230,000",
        "demand": "High",
        "key_skills": ["System Architecture", "React", "Python/Go", "Leadership", "Product Strategy"]
    }
]

class RoadmapRequest(BaseModel):
    resume_id: Optional[int] = None
    target_role: str
    current_skills: Optional[List[str]] = []

@router.get("/roles")
def get_popular_roles():
    return POPULAR_ROLES

@router.post("/roadmap")
async def generate_career_roadmap(req: RoadmapRequest, db: Session = Depends(get_db)):
    skills = req.current_skills or []
    if req.resume_id:
        resume = db.query(ResumeRecord).filter(ResumeRecord.id == req.resume_id).first()
        if resume and resume.detected_skills_json:
            parsed_skills = json.loads(resume.detected_skills_json)
            skills = parsed_skills.get("all_skills", skills)

    roadmap_data = await AIService.generate_career_roadmap(req.target_role, skills)

    # Save to database if resume_id is provided
    if req.resume_id:
        try:
            record = CareerRoadmapRecord(
                resume_id=req.resume_id,
                target_role=req.target_role,
                current_level=roadmap_data.get("current_level_assessment", "Mid-Level"),
                timeline_json=json.dumps(roadmap_data.get("milestones", [])),
                milestones_json=json.dumps(roadmap_data.get("milestones", [])),
                recommended_certifications_json=json.dumps(roadmap_data.get("top_certifications", []))
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to persist career roadmap: {e}")

    from services.activity_logger import log_activity
    log_activity(
        db=db,
        action_type="ROADMAP_GEN",
        details=f"Generated step-by-step career acceleration roadmap for '{req.target_role}'.",
        metadata_json=json.dumps({"target_role": req.target_role})
    )

    return roadmap_data
