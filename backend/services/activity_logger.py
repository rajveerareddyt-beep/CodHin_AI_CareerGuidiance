import logging
from typing import Optional, Any
from sqlalchemy.orm import Session
from models import ActivityLogRecord, UserRecord

logger = logging.getLogger("activity_logger")

ADMIN_EMAILS = {
    "a05370457@gmail.com",
    "rajveerereddyt@gmal.com",
    "rajveerereddyt@gmail.com"
}

def is_admin_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return email.strip().lower() in ADMIN_EMAILS

def log_activity(
    db: Session,
    action_type: str,
    details: str,
    user: Optional[UserRecord] = None,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    metadata_json: Optional[str] = None
):
    """Safely logs user activity to the activity_logs table for Admin monitoring."""
    try:
        email = user.email if user else (user_email or "guest@auracareer.ai")
        name = user.full_name if user else (user_name or "Guest User")
        u_id = user.id if user else None

        rec = ActivityLogRecord(
            user_id=u_id,
            user_email=email,
            user_name=name,
            action_type=action_type,
            details=details,
            metadata_json=metadata_json
        )
        db.add(rec)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to record activity log: {e}")
        try:
            db.rollback()
        except Exception:
            pass
