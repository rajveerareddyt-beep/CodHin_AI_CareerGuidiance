import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
from models import UserRecord, UserSessionRecord, ResumeRecord
from security import hash_password, verify_password, generate_session_token, get_session_expiry

logger = logging.getLogger("auth_router")
router = APIRouter(prefix="/api/auth", tags=["Authentication & Sessions"])

from services.activity_logger import log_activity, is_admin_email

# Request / Response Schemas
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_admin: Optional[bool] = False
    created_at: str

class AuthResponse(BaseModel):
    success: bool
    token: str
    user: UserProfile
    message: str

# Dependencies for session resolution
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserRecord:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session token required. Please sign in."
        )

    token = authorization.split("Bearer ")[1].strip()
    session_rec = db.query(UserSessionRecord).filter(
        UserSessionRecord.token == token,
        UserSessionRecord.is_active == True,
        UserSessionRecord.expires_at > datetime.utcnow()
    ).first()

    if not session_rec or not session_rec.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please log in again."
        )

    return session_rec.user

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[UserRecord]:
    """Resolves user if token is provided, returns None otherwise without blocking."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ")[1].strip()
    session_rec = db.query(UserSessionRecord).filter(
        UserSessionRecord.token == token,
        UserSessionRecord.is_active == True,
        UserSessionRecord.expires_at > datetime.utcnow()
    ).first()

    return session_rec.user if session_rec else None

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    if "@" not in email_clean or "." not in email_clean:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    existing_user = db.query(UserRecord).filter(UserRecord.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pwd_hash, salt = hash_password(req.password)
    user_role = "admin" if is_admin_email(email_clean) else "user"

    user = UserRecord(
        email=email_clean,
        full_name=req.full_name.strip() or "User",
        role=user_role,
        password_hash=pwd_hash,
        password_salt=salt
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate isolated session token
    token = generate_session_token()
    session_rec = UserSessionRecord(
        user_id=user.id,
        token=token,
        expires_at=get_session_expiry(days=7),
        is_active=True
    )
    db.add(session_rec)
    db.commit()

    log_activity(
        db=db,
        user=user,
        action_type="REGISTER",
        details=f"New user registered with role '{user.role}'."
    )

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_admin": user.role == "admin" or is_admin_email(user.email),
            "created_at": user.created_at.isoformat()
        },
        "message": f"Welcome, {user.full_name}! Account created successfully."
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(UserRecord).filter(UserRecord.email == email_clean).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="No account found with this email. Please click 'Create Account' tab above to register."
        )

    if not verify_password(req.password, user.password_hash, user.password_salt):
        raise HTTPException(
            status_code=400,
            detail="Incorrect password. Please check your password and try again."
        )

    # Ensure designated admins maintain admin role
    if is_admin_email(email_clean) and user.role != "admin":
        user.role = "admin"
        db.commit()

    # Create new isolated session token
    token = generate_session_token()
    session_rec = UserSessionRecord(
        user_id=user.id,
        token=token,
        expires_at=get_session_expiry(days=7),
        is_active=True
    )
    db.add(session_rec)
    db.commit()

    log_activity(
        db=db,
        user=user,
        action_type="LOGIN",
        details=f"User signed into their account ({user.role.upper()} access)."
    )

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_admin": user.role == "admin" or is_admin_email(user.email),
            "created_at": user.created_at.isoformat()
        },
        "message": f"Welcome back, {user.full_name}!"
    }

@router.get("/me")
def get_me(current_user: UserRecord = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_admin": current_user.role == "admin" or is_admin_email(current_user.email),
        "created_at": current_user.created_at.isoformat()
    }

@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        session_rec = db.query(UserSessionRecord).filter(UserSessionRecord.token == token).first()
        if session_rec:
            session_rec.is_active = False
            db.commit()

    return {"success": True, "message": "Logged out successfully."}

@router.get("/my-resumes")
def get_my_resumes(
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns only resumes belonging to the currently logged in user."""
    resumes = db.query(ResumeRecord).filter(
        ResumeRecord.user_id == current_user.id
    ).order_by(ResumeRecord.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "candidate_name": r.candidate_name,
            "target_role": r.target_role,
            "email": r.email,
            "ats_score": r.ats_score,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in resumes
    ]
