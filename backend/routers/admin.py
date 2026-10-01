import json
import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import UserRecord, UserSessionRecord, ResumeRecord, JobMatchRecord, CareerRoadmapRecord, ChatMessageRecord, ActivityLogRecord
from routers.auth import get_current_user
from services.activity_logger import ADMIN_EMAILS, is_admin_email

logger = logging.getLogger("admin_router")
router = APIRouter(prefix="/api/admin", tags=["Admin Command Center"])

def require_admin_user(current_user: UserRecord = Depends(get_current_user)) -> UserRecord:
    """Ensures the requester has verified Admin permissions."""
    if current_user.role != "admin" and not is_admin_email(current_user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required to access this command center."
        )
    return current_user

@router.get("/overview")
def get_admin_overview(
    admin: UserRecord = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(UserRecord.id)).scalar() or 0
    total_resumes = db.query(func.count(ResumeRecord.id)).scalar() or 0
    total_matches = db.query(func.count(JobMatchRecord.id)).scalar() or 0
    total_roadmaps = db.query(func.count(CareerRoadmapRecord.id)).scalar() or 0
    total_chats = db.query(func.count(ChatMessageRecord.id)).scalar() or 0
    total_activities = db.query(func.count(ActivityLogRecord.id)).scalar() or 0
    
    avg_score_row = db.query(func.avg(ResumeRecord.ats_score)).scalar()
    avg_ats = round(float(avg_score_row), 1) if avg_score_row else 0.0

    recent_sessions = db.query(UserSessionRecord).filter(
        UserSessionRecord.is_active == True,
        UserSessionRecord.expires_at > datetime.utcnow()
    ).count()

    return {
        "success": True,
        "admin_user": admin.email,
        "metrics": {
            "total_users": total_users,
            "total_resumes": total_resumes,
            "total_job_matches": total_matches,
            "total_roadmaps": total_roadmaps,
            "total_chat_messages": total_chats,
            "total_activities_logged": total_activities,
            "avg_ats_score": avg_ats,
            "active_sessions": recent_sessions
        }
    }

@router.get("/users")
def get_all_users(
    admin: UserRecord = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(UserRecord).order_by(UserRecord.created_at.desc()).all()
    user_list = []

    for u in users:
        resume_count = db.query(func.count(ResumeRecord.id)).filter(ResumeRecord.user_id == u.id).scalar() or 0
        match_count = db.query(func.count(JobMatchRecord.id)).filter(JobMatchRecord.user_id == u.id).scalar() or 0
        roadmap_count = db.query(func.count(CareerRoadmapRecord.id)).filter(CareerRoadmapRecord.user_id == u.id).scalar() or 0
        last_activity = db.query(ActivityLogRecord).filter(ActivityLogRecord.user_id == u.id).order_by(ActivityLogRecord.created_at.desc()).first()

        user_list.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_admin": u.role == "admin" or is_admin_email(u.email),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "resumes_count": resume_count,
            "job_matches_count": match_count,
            "roadmaps_count": roadmap_count,
            "last_active": last_activity.created_at.isoformat() if last_activity else u.created_at.isoformat() if u.created_at else None,
            "last_action": last_activity.action_type if last_activity else "Joined"
        })

    return {"success": True, "users": user_list, "total": len(user_list)}

@router.get("/activities")
def get_activity_feed(
    limit: int = 50,
    admin: UserRecord = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Returns the live chronological stream of what all users are doing across the platform."""
    logs = db.query(ActivityLogRecord).order_by(ActivityLogRecord.created_at.desc()).limit(limit).all()
    
    feed = []
    for log in logs:
        feed.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user_name or "Guest / Unauthenticated",
            "user_email": log.user_email or "guest",
            "action_type": log.action_type,
            "details": log.details,
            "metadata": json.loads(log.metadata_json) if log.metadata_json else {},
            "timestamp": log.created_at.isoformat() if log.created_at else datetime.utcnow().isoformat()
        })

    return {"success": True, "activities": feed, "count": len(feed)}

@router.get("/resumes")
def get_all_resumes(
    limit: int = 50,
    admin: UserRecord = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Allows admin to inspect all uploaded resumes, target roles, ATS scores and candidate data."""
    resumes = db.query(ResumeRecord).order_by(ResumeRecord.created_at.desc()).limit(limit).all()
    
    results = []
    for r in resumes:
        owner = db.query(UserRecord).filter(UserRecord.id == r.user_id).first() if r.user_id else None
        results.append({
            "id": r.id,
            "filename": r.filename,
            "candidate_name": r.candidate_name,
            "target_role": r.target_role,
            "email": r.email,
            "phone": r.phone,
            "ats_score": r.ats_score,
            "owner_email": owner.email if owner else "Guest Upload",
            "owner_name": owner.full_name if owner else "Guest",
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {"success": True, "resumes": results, "total": len(results)}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: UserRecord = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(UserRecord).filter(UserRecord.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    email = user.email
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {email} and all associated records deleted."}
