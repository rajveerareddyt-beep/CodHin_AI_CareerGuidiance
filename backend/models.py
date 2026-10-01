from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class UserRecord(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)  # "admin" or "user"
    password_hash = Column(String(255), nullable=False)
    password_salt = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("UserSessionRecord", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeRecord", back_populates="user", cascade="all, delete-orphan")
    job_matches = relationship("JobMatchRecord", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("CareerRoadmapRecord", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessageRecord", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityLogRecord", back_populates="user", cascade="all, delete-orphan")


class ActivityLogRecord(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    user_name = Column(String(255), nullable=True)
    action_type = Column(String(100), nullable=False)  # "LOGIN", "REGISTER", "UPLOAD_RESUME", "JOB_MATCH", "ROADMAP_GEN", "AI_CHAT"
    details = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserRecord", back_populates="activities")


class UserSessionRecord(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserRecord", back_populates="sessions")


class ResumeRecord(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    candidate_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    linkedin = Column(String(255), nullable=True)
    github = Column(String(255), nullable=True)
    portfolio = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=True, default="Software Engineer")

    # Parsed Content
    parsed_text = Column(Text, nullable=True)
    parsed_sections_json = Column(Text, nullable=True)
    detected_skills_json = Column(Text, nullable=True)

    # ATS Scoring
    ats_score = Column(Float, default=0.0)
    ats_breakdown_json = Column(Text, nullable=True)
    ats_feedback_json = Column(Text, nullable=True)

    # AI Guidance & Analysis
    ai_critique_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("UserRecord", back_populates="resumes")
    job_matches = relationship("JobMatchRecord", back_populates="resume", cascade="all, delete-orphan")
    roadmaps = relationship("CareerRoadmapRecord", back_populates="resume", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessageRecord", back_populates="resume", cascade="all, delete-orphan")


class JobMatchRecord(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    job_title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=True)
    match_percentage = Column(Float, default=0.0)
    matched_skills_json = Column(Text, nullable=True)
    missing_skills_json = Column(Text, nullable=True)
    recommendations_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserRecord", back_populates="job_matches")
    resume = relationship("ResumeRecord", back_populates="job_matches")


class CareerRoadmapRecord(Base):
    __tablename__ = "career_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    target_role = Column(String(255), nullable=False)
    current_level = Column(String(100), default="Intermediate")
    timeline_json = Column(Text, nullable=True)
    milestones_json = Column(Text, nullable=True)
    recommended_certifications_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserRecord", back_populates="roadmaps")
    resume = relationship("ResumeRecord", back_populates="roadmaps")


class ChatMessageRecord(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    sender = Column(String(50), nullable=False)  # "user" or "assistant"
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserRecord", back_populates="chat_messages")
    resume = relationship("ResumeRecord", back_populates="chat_messages")


class AppConfigRecord(Base):
    __tablename__ = "app_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
