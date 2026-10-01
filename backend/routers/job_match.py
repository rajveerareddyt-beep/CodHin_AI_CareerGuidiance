import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import JobMatchRecord, ResumeRecord
from services.ai_service import AIService

logger = logging.getLogger("job_match_router")
router = APIRouter(prefix="/api/job-match", tags=["Job Matching"])

class JobMatchRequest(BaseModel):
    resume_id: Optional[int] = None
    job_title: str
    job_description: str
    resume_skills: Optional[List[str]] = []
    resume_text: Optional[str] = ""

PRESET_JOB_DESCRIPTIONS = [
    {
        "title": "Senior Full-Stack Engineer (React / Node / Cloud)",
        "company": "Stripe / Airbnb-scale Tech",
        "description": """
We are seeking a Senior Full-Stack Engineer to architect and scale our customer-facing products. 
Responsibilities:
- Build performant, accessible web experiences using React, TypeScript, and modern state management.
- Design resilient microservices with Node.js/Python, MySQL/PostgreSQL, and Redis caching.
- Deploy and monitor cloud services on AWS utilizing Docker and Kubernetes with automated CI/CD pipelines.
- Collaborate with product and design teams to deliver seamless user experiences with 99.99% availability.
Qualifications:
- 4+ years of professional full-stack web engineering experience.
- Deep proficiency in TypeScript, React, Node.js, SQL, REST APIs, and distributed caching.
- Hands-on experience with Docker, cloud infrastructure (AWS/GCP), and unit/integration testing (Jest/PyTest).
- Excellent communication and system design fundamentals.
"""
    },
    {
        "title": "Machine Learning / Generative AI Engineer",
        "company": "NextGen AI Labs",
        "description": """
Looking for an applied AI/ML Engineer to build state-of-the-art Generative AI applications and LLM agent pipelines.
Responsibilities:
- Design, optimize, and serve large language model (LLM) RAG systems and multimodal pipelines.
- Build low-latency inference APIs with Python, FastAPI, PyTorch, and Vector Databases (Pinecone/Milvus).
- Fine-tune and evaluate open-source foundation models using Hugging Face and distributed compute.
- Containerize models with Docker and deploy to Kubernetes with automated drift monitoring.
Qualifications:
- Strong programming background in Python, PyTorch, Scikit-Learn, and FastAPI.
- Deep understanding of NLP, transformers, vector embeddings, and LangChain/LlamaIndex.
- Experience with Docker, cloud GPU instances (AWS SageMaker / GCP), and MLOps practices.
"""
    },
    {
        "title": "Cloud DevOps & Platform Engineer",
        "company": "CloudScale Systems",
        "description": """
Join our Infrastructure team as a Senior DevOps / Site Reliability Engineer managing high-scale multi-region clusters.
Responsibilities:
- Automate cloud infrastructure provisioning using Terraform and Infrastructure-as-Code (IaC).
- Architect, manage, and scale production Kubernetes (EKS/GKE) clusters running hundreds of microservices.
- Design robust CI/CD pipelines with GitHub Actions / GitLab CI for zero-downtime rolling deployments.
- Implement observability, alerting, and logging using Prometheus, Grafana, and ELK stack.
Qualifications:
- 3+ years managing production AWS/GCP cloud environments.
- Deep expertise with Docker, Kubernetes, Linux internals, Bash, and Terraform.
- Solid understanding of network security, TLS/SSL, IAM policies, and disaster recovery.
"""
    }
]

@router.get("/presets")
def get_presets():
    return PRESET_JOB_DESCRIPTIONS

@router.post("")
async def match_job(req: JobMatchRequest, db: Session = Depends(get_db)):
    skills = req.resume_skills or []
    text = req.resume_text or ""

    if req.resume_id:
        resume = db.query(ResumeRecord).filter(ResumeRecord.id == req.resume_id).first()
        if resume:
            text = resume.parsed_text or ""
            if resume.detected_skills_json:
                p_skills = json.loads(resume.detected_skills_json)
                skills = p_skills.get("all_skills", skills)

    if not skills and not text:
        raise HTTPException(status_code=400, detail="Must provide either resume_id or resume_skills/resume_text.")

    match_result = await AIService.match_job_description(
        resume_skills=skills,
        resume_text=text,
        job_title=req.job_title,
        job_description=req.job_description
    )

    from services.activity_logger import log_activity
    from routers.auth import get_optional_user
    
    # Persist if resume_id is available
    if req.resume_id:
        try:
            record = JobMatchRecord(
                resume_id=req.resume_id,
                job_title=req.job_title,
                job_description=req.job_description[:2000],
                match_percentage=match_result.get("match_percentage", 0.0),
                matched_skills_json=json.dumps(match_result.get("matched_skills", [])),
                missing_skills_json=json.dumps(match_result.get("missing_skills", [])),
                recommendations_json=json.dumps(match_result)
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            match_result["record_id"] = record.id
        except Exception as e:
            logger.warning(f"Could not persist JobMatchRecord: {e}")

    log_activity(
        db=db,
        action_type="JOB_MATCH",
        details=f"Ran ATS Relevancy matcher for '{req.job_title}'. Match score: {match_result.get('match_percentage', 0)}% ({match_result.get('fit_verdict', 'Evaluated')}).",
        metadata_json=json.dumps({"job_title": req.job_title, "match_percentage": match_result.get("match_percentage", 0)})
    )

    return match_result
