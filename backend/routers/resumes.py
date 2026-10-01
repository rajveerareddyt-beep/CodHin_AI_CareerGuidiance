import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ResumeRecord, UserRecord
from parsers.resume_parser import ResumeParser
from ats.scorer import ATSScorer
from services.ai_service import AIService
from routers.auth import get_optional_user

logger = logging.getLogger("resumes_router")
router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

SAMPLE_RESUMES = {
    "fullstack": {
        "candidate_name": "Alexander Morgan",
        "target_role": "Senior Full-Stack Engineer",
        "filename": "sample_alex_morgan_fullstack.pdf",
        "text": """
Alexander Morgan
alex.morgan@techforge.io | (555) 234-8901 | linkedin.com/in/alexandermorgan | github.com/alexmorgan-dev
San Francisco, CA

PROFESSIONAL SUMMARY
Results-driven Full-Stack Engineer with 5+ years of experience engineering scalable web applications and distributed cloud architectures. Spearheaded migration of legacy systems to modern React, Node.js, and microservices on AWS, driving a 45% reduction in latency and 99.99% availability.

CORE TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML, CSS, Bash
Frameworks: React, Next.js, Node.js, Express, FastAPI, Tailwind CSS, Redux
Databases & Cloud: MySQL, PostgreSQL, Redis, AWS (S3, ECS, Lambda), Docker, Kubernetes, CI/CD
Tools & Practices: Git, REST API, GraphQL, System Design, Agile, Scrum, Jest, PyTest

PROFESSIONAL EXPERIENCE
Senior Full-Stack Developer | NovaCloud Solutions | 2022 – Present
• Architected and deployed microservices architecture handling 15,000+ requests per second, reducing infrastructure costs by 32% ($120,000 annually).
• Engineered real-time collaborative dashboard using React, TypeScript, and WebSockets, accelerating team productivity by 40% for over 50,000 active users.
• Optimized complex MySQL database queries and implemented distributed Redis caching, decreasing average page load time from 3.2s to 650ms.
• Mentored 6 junior and mid-level software engineers on code review standards, test-driven development (TDD), and cloud-native patterns.

Full-Stack Software Engineer | Apex Digital Labs | 2019 – 2022
• Developed 18+ high-traffic RESTful APIs utilizing Node.js, Express, and PostgreSQL with 95% automated test coverage.
• Spearheaded frontend revamp migrating monolithic codebase to modular React with Next.js, boosting mobile conversion rates by 28%.
• Automated continuous integration and continuous deployment (CI/CD) pipelines with GitHub Actions and Docker, cutting deployment cycles from 4 hours to 12 minutes.
• Resolved 120+ mission-critical production tickets, maintaining 99.95% system uptime across global customer clusters.

EDUCATION & CERTIFICATIONS
• Bachelor of Science in Computer Science | University of California, Berkeley | 2019
• AWS Certified Solutions Architect – Associate | Amazon Web Services | 2023
• Certified Kubernetes Administrator (CKA) | Linux Foundation | 2024
"""
    },
    "junior_frontend": {
        "candidate_name": "Samantha Chen",
        "target_role": "Frontend Developer",
        "filename": "sample_samantha_chen_frontend.pdf",
        "text": """
Samantha Chen
samantha.chen@email.com | (555) 876-5432 | github.com/samanthachen | linkedin.com/in/samanthachen-dev
Seattle, WA

OBJECTIVE
Passionate and detail-oriented Frontend Developer with 1.5 years of experience building interactive web applications using React, TypeScript, and modern CSS. Eager to contribute clean code, modern UI/UX design, and cross-browser responsiveness to an innovative product engineering team.

TECHNICAL SKILLS
• Programming: JavaScript, TypeScript, HTML, CSS, Python
• Frameworks & Libraries: React.js, Next.js, Redux Toolkit, Tailwind CSS, Bootstrap
• Tools: Git, GitHub, VS Code, Postman, Vite, Webpack, Figma

WORK EXPERIENCE
Junior Frontend Developer | Horizon Tech | 2023 – Present
• Developed interactive user interfaces using React and Tailwind CSS for client-facing e-commerce platforms.
• Collaborated with backend engineers to consume RESTful endpoints and integrate payment checkout flows.
• Improved mobile responsiveness and accessibility across 3 web properties, boosting user retention by 15%.
• Assisted team with debugging cross-browser UI glitches and unit testing using Jest.

PROJECTS
• DevTracker - Developer Analytics Portal: Built full-stack dashboard with React and Chart.js tracking developer sprint metrics; gained 500+ GitHub stars.
• EcoShop - Sustainable Marketplace: Designed responsive UI with Next.js and Tailwind CSS featuring dynamic filtering and dark mode.

EDUCATION
• Bachelor of Science in Information Technology | University of Washington | 2023
"""
    },
    "aiml": {
        "candidate_name": "Dr. Marcus Vance",
        "target_role": "AI / Machine Learning Engineer",
        "filename": "sample_marcus_vance_aiml.pdf",
        "text": """
Dr. Marcus Vance
marcus.vance@ai-labs.org | (555) 345-6789 | linkedin.com/in/marcus-vance-ai | github.com/marcusvance
Boston, MA

PROFESSIONAL SUMMARY
Applied AI/ML Engineer with PhD in Computer Science and 4+ years of industrial experience designing and operationalizing deep learning models, LLM pipelines, and computer vision systems. Proven record of cutting inference costs by 55% while elevating model accuracy across production deployments.

AREAS OF EXPERTISE
• Languages: Python, C++, SQL, R, Bash
• AI/ML: PyTorch, TensorFlow, Scikit-Learn, Hugging Face, LangChain, OpenCV, NLP, Deep Learning, Generative AI
• Data & MLOps: Pandas, NumPy, Docker, Kubernetes, MLflow, AWS SageMaker, FastAPI
• Databases: PostgreSQL, MongoDB, Redis, Pinecone Vector DB

EXPERIENCE
Lead Machine Learning Engineer | Cognition Dynamics | 2022 – Present
• Architected proprietary enterprise LLM RAG (Retrieval-Augmented Generation) pipeline using LangChain, PyTorch, and Pinecone, processing 2M+ customer queries daily.
• Optimized transformer model quantization and GPU inference pipelines, reducing latency by 62% (from 800ms to 304ms) and slashing AWS infrastructure spend by $85,000.
• Led cross-functional team of 5 data scientists and ML engineers deploying production models with automated CI/CD via Docker and Kubernetes.

Machine Learning Researcher | Apex AI Research | 2020 – 2022
• Engineered computer vision classification pipelines using PyTorch and OpenCV achieving 96.8% accuracy on complex diagnostic datasets.
• Published 3 peer-reviewed papers at top AI conferences on efficient neural network architectures.
• Implemented automated model monitoring and drift detection with MLflow, reducing false positives by 38%.

EDUCATION
• Ph.D. in Computer Science (Artificial Intelligence) | MIT | 2020
• B.S. in Applied Mathematics | Columbia University | 2016
"""
    }
}

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".pptx", ".ppt", 
    ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif", ".svg",
    ".txt", ".rtf", ".md"
}

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form("Software Engineer"),
    current_user: Optional[UserRecord] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    import os
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS and not any(file.filename.lower().endswith(e) for e in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, Word (.docx/.doc), PowerPoint (.pptx/.ppt), Images (.jpg, .jpeg, .png, .webp), and Text (.txt)."
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # If it is an image, attempt Vision LLM transcription if available
        vision_text = None
        if ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"]:
            mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else f"image/{ext.lstrip('.')}"
            try:
                vision_text = await AIService.transcribe_image(file_bytes, mime_type=mime_type)
            except Exception as e:
                logger.warning(f"Vision transcription fallback: {e}")

        # 1. Parse with multi-format Document Parser
        parsed_data = ResumeParser.parse(file_bytes, filename=file.filename, vision_text=vision_text)

        # 2. Rule-based ATS evaluation with Target Role Relevancy Alignment
        ats_results = ATSScorer.score_resume(parsed_data, target_role=target_role)

        candidate_name = parsed_data["contact_info"]["name"] or (current_user.full_name if current_user else "Candidate")
        detected_skills = parsed_data["skills"]["all_skills"]

        # 3. AI Service critique (LLM + smart fallback)
        ai_critique = await AIService.analyze_resume_critique(
            candidate_name=candidate_name,
            target_role=target_role,
            full_text=parsed_data["full_text"],
            detected_skills=detected_skills,
            ats_score=ats_results["overall_score"]
        )

        # 4. Save to Database (MySQL / SQLite) scoped to user
        record = ResumeRecord(
            user_id=current_user.id if current_user else None,
            filename=file.filename,
            candidate_name=candidate_name,
            email=parsed_data["contact_info"]["email"] or (current_user.email if current_user else None),
            phone=parsed_data["contact_info"]["phone"],
            linkedin=parsed_data["contact_info"]["linkedin"],
            github=parsed_data["contact_info"]["github"],
            portfolio=parsed_data["contact_info"]["portfolio"],
            target_role=target_role,
            parsed_text=parsed_data["full_text"],
            parsed_sections_json=json.dumps(parsed_data["sections"]),
            detected_skills_json=json.dumps(parsed_data["skills"]),
            ats_score=ats_results["overall_score"],
            ats_breakdown_json=json.dumps(ats_results["breakdown"]),
            ats_feedback_json=json.dumps({
                "checklist": ats_results["checklist"],
                "bullet_reviews": ats_results["bullet_reviews"],
                "tier": ats_results["tier"],
                "color": ats_results["color"]
            }),
            ai_critique_json=json.dumps(ai_critique)
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        from services.activity_logger import log_activity
        log_activity(
            db=db,
            user=current_user,
            user_email=current_user.email if current_user else (parsed_data["contact_info"]["email"] or "Guest User"),
            user_name=candidate_name,
            action_type="UPLOAD_RESUME",
            details=f"Analyzed resume '{file.filename}' for '{target_role}'. ATS Score: {ats_results['overall_score']}/100 ({ats_results['tier']}).",
            metadata_json=json.dumps({"resume_id": record.id, "filename": file.filename, "target_role": target_role, "ats_score": ats_results["overall_score"]})
        )

        return {
            "success": True,
            "resume_id": record.id,
            "candidate_name": candidate_name,
            "target_role": target_role,
            "filename": file.filename,
            "metadata": parsed_data["metadata"],
            "contact_info": parsed_data["contact_info"],
            "sections": parsed_data["sections"],
            "skills": parsed_data["skills"],
            "ats_results": ats_results,
            "ai_critique": ai_critique
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the document: {str(e)}"
        )

@router.api_route("/sample/{sample_key}", methods=["GET", "POST"])
async def load_sample_resume(
    sample_key: str,
    current_user: Optional[UserRecord] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Loads a pre-configured sample resume for 1-click test drive."""
    if sample_key not in SAMPLE_RESUMES:
        raise HTTPException(status_code=404, detail="Sample resume not found. Options: fullstack, junior_frontend, aiml")

    sample = SAMPLE_RESUMES[sample_key]
    full_text = sample["text"].strip()
    lines = full_text.splitlines()

    # Mock blocks for parser
    blocks = [{"text": l, "size": 14 if i == 1 else 10, "flags": 0, "page": 1} for i, l in enumerate(lines[:10])]
    contacts = ResumeParser.extract_contacts(full_text, blocks)
    contacts["name"] = sample["candidate_name"]
    sections = ResumeParser.segment_sections(full_text)
    skills = ResumeParser.extract_skills(full_text)
    metadata = {
        "page_count": 1,
        "word_count": len(full_text.split()),
        "bullet_count": len([l for l in lines if l.strip().startswith("•") or l.strip().startswith("-")])
    }

    parsed_data = {
        "metadata": metadata,
        "contact_info": contacts,
        "sections": sections,
        "skills": skills,
        "full_text": full_text
    }

    ats_results = ATSScorer.score_resume(parsed_data, target_role=sample["target_role"])
    ai_critique = await AIService.analyze_resume_critique(
        candidate_name=sample["candidate_name"],
        target_role=sample["target_role"],
        full_text=full_text,
        detected_skills=skills["all_skills"],
        ats_score=ats_results["overall_score"]
    )

    record = ResumeRecord(
        user_id=current_user.id if current_user else None,
        filename=sample["filename"],
        candidate_name=sample["candidate_name"],
        email=contacts["email"],
        phone=contacts["phone"],
        linkedin=contacts["linkedin"],
        github=contacts["github"],
        portfolio=contacts["portfolio"],
        target_role=sample["target_role"],
        parsed_text=full_text,
        parsed_sections_json=json.dumps(sections),
        detected_skills_json=json.dumps(skills),
        ats_score=ats_results["overall_score"],
        ats_breakdown_json=json.dumps(ats_results["breakdown"]),
        ats_feedback_json=json.dumps({
            "checklist": ats_results["checklist"],
            "bullet_reviews": ats_results["bullet_reviews"],
            "tier": ats_results["tier"],
            "color": ats_results["color"]
        }),
        ai_critique_json=json.dumps(ai_critique)
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "resume_id": record.id,
        "candidate_name": sample["candidate_name"],
        "target_role": sample["target_role"],
        "filename": sample["filename"],
        "metadata": metadata,
        "contact_info": contacts,
        "sections": sections,
        "skills": skills,
        "ats_results": ats_results,
        "ai_critique": ai_critique
    }

@router.get("")
def list_resumes(
    limit: int = 15,
    current_user: Optional[UserRecord] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(ResumeRecord)
    if current_user:
        query = query.filter(ResumeRecord.user_id == current_user.id)
    else:
        query = query.filter(ResumeRecord.user_id == None)

    resumes = query.order_by(ResumeRecord.created_at.desc()).limit(limit).all()
    results = []
    for r in resumes:
        results.append({
            "id": r.id,
            "filename": r.filename,
            "candidate_name": r.candidate_name,
            "target_role": r.target_role,
            "email": r.email,
            "ats_score": r.ats_score,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return results

@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current_user: Optional[UserRecord] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(ResumeRecord).filter(ResumeRecord.id == resume_id)
    if current_user:
        # Allow user to view their own resume or public sample
        query = query.filter((ResumeRecord.user_id == current_user.id) | (ResumeRecord.user_id == None))

    r = query.first()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "id": r.id,
        "filename": r.filename,
        "candidate_name": r.candidate_name,
        "target_role": r.target_role,
        "email": r.email,
        "phone": r.phone,
        "linkedin": r.linkedin,
        "github": r.github,
        "portfolio": r.portfolio,
        "parsed_text": r.parsed_text,
        "sections": json.loads(r.parsed_sections_json or "{}"),
        "skills": json.loads(r.detected_skills_json or "{}"),
        "ats_score": r.ats_score,
        "ats_breakdown": json.loads(r.ats_breakdown_json or "{}"),
        "ats_feedback": json.loads(r.ats_feedback_json or "{}"),
        "ai_critique": json.loads(r.ai_critique_json or "{}"),
        "created_at": r.created_at.isoformat() if r.created_at else None
    }

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: Optional[UserRecord] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(ResumeRecord).filter(ResumeRecord.id == resume_id)
    if current_user:
        query = query.filter(ResumeRecord.user_id == current_user.id)

    r = query.first()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found or unauthorized to delete")
    db.delete(r)
    db.commit()
    return {"success": True, "message": f"Resume {resume_id} deleted."}
