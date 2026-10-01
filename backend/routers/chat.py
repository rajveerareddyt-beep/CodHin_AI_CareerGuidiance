import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import ChatMessageRecord, ResumeRecord
from services.ai_service import AIService

logger = logging.getLogger("chat_router")
router = APIRouter(prefix="/api/chat", tags=["Career Counselor Chat"])

class ChatRequest(BaseModel):
    resume_id: Optional[int] = None
    message: str
    history: Optional[List[Dict[str, str]]] = []
    candidate_context: Optional[Dict[str, Any]] = None

@router.post("")
async def send_chat_message(req: ChatRequest, db: Session = Depends(get_db)):
    context = req.candidate_context or {}

    if req.resume_id:
        resume = db.query(ResumeRecord).filter(ResumeRecord.id == req.resume_id).first()
        if resume:
            skills = []
            if resume.detected_skills_json:
                skills = json.loads(resume.detected_skills_json).get("all_skills", [])
            context = {
                "name": resume.candidate_name,
                "target_role": resume.target_role,
                "skills": skills,
                "ats_score": resume.ats_score
            }

    # Fetch recent DB history if resume_id is set and history is empty
    history = req.history or []
    if req.resume_id and not history:
        db_msgs = db.query(ChatMessageRecord).filter(ChatMessageRecord.resume_id == req.resume_id).order_by(ChatMessageRecord.timestamp.asc()).limit(10).all()
        history = [{"sender": m.sender, "message": m.message} for m in db_msgs]

    # Call AI Counselor
    assistant_reply = await AIService.chat_counselor(
        user_message=req.message,
        candidate_context=context,
        history=history
    )

    # Persist both user message and assistant reply if resume_id is set
    if req.resume_id:
        try:
            user_rec = ChatMessageRecord(resume_id=req.resume_id, sender="user", message=req.message)
            ai_rec = ChatMessageRecord(resume_id=req.resume_id, sender="assistant", message=assistant_reply)
            db.add_all([user_rec, ai_rec])
            db.commit()
        except Exception as e:
            logger.warning(f"Could not persist chat messages: {e}")

    from services.activity_logger import log_activity
    log_activity(
        db=db,
        action_type="AI_CHAT",
        details=f"Asked AI Counselor: \"{req.message[:80]}{'...' if len(req.message) > 80 else ''}\"",
        metadata_json=json.dumps({"prompt": req.message[:120]})
    )

    return {
        "reply": assistant_reply,
        "sender": "assistant"
    }

@router.get("/history/{resume_id}")
def get_chat_history(resume_id: int, db: Session = Depends(get_db)):
    messages = db.query(ChatMessageRecord).filter(ChatMessageRecord.resume_id == resume_id).order_by(ChatMessageRecord.timestamp.asc()).all()
    return [{"id": m.id, "sender": m.sender, "message": m.message, "timestamp": m.timestamp.isoformat()} for m in messages]
