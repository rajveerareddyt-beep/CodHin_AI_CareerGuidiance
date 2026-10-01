import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db_manager, Base
from routers import resumes, guidance, job_match, chat, settings, auth, admin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    logger.info("Initializing database schema...")
    try:
        import models  # Ensure all model tables are registered with declarative Base
        Base.metadata.create_all(bind=db_manager.engine)
        db_manager.sync_schema()
        logger.info(f"Database schema initialized successfully on {db_manager.db_type}.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    yield
    # Shutdown
    logger.info("Application shutting down...")

app = FastAPI(
    title="AI Career Guidance & Resume Analyzer API",
    description="Enterprise-grade Resume Parsing (PyMuPDF), Rule-based ATS Evaluation, AI Guidance (LLM), and Career Roadmaps.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(resumes.router)
app.include_router(guidance.router)
app.include_router(job_match.router)
app.include_router(chat.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "service": "AI Career Guidance & Resume Analyzer API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "active_database": db_manager.db_type
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "db": db_manager.get_status()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
