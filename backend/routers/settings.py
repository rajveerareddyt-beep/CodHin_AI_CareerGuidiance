import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import db_manager, Base
from services.ai_service import AIService
from models import UserRecord
from routers.admin import require_admin_user

logger = logging.getLogger("settings_router")
router = APIRouter(prefix="/api/settings", tags=["Settings"])

class DatabaseConfigRequest(BaseModel):
    host: str = "localhost"
    port: int = 3306
    user: str = "root"
    password: str = ""
    database: str = "career_ai"

class LLMConfigRequest(BaseModel):
    provider: str = "gemini"  # "gemini" or "openai"
    api_key: str
    model: str = "gemini-1.5-flash"

@router.get("/status")
def get_system_status():
    db_status = db_manager.get_status()
    llm_config = AIService.get_api_config()

    return {
        "database": db_status,
        "llm": {
            "provider": llm_config["provider"],
            "has_gemini": bool(llm_config["gemini_key"]),
            "has_openai": bool(llm_config["openai_key"]),
            "active_model": llm_config["gemini_model"] if llm_config["provider"] == "gemini" else llm_config["openai_model"],
            "has_active_llm": llm_config["has_llm"]
        }
    }

@router.post("/database")
def configure_database(
    req: DatabaseConfigRequest,
    admin: UserRecord = Depends(require_admin_user)
):
    """Tests MySQL credentials, creates DB if missing, and switches active engine."""
    success, message = db_manager.try_init_mysql(
        host=req.host,
        port=req.port,
        user=req.user,
        password=req.password,
        database=req.database
    )

    if not success:
        return {
            "success": False,
            "message": f"Connection failed: {message}",
            "active_db": db_manager.db_type
        }

    # Automatically create tables in MySQL
    try:
        Base.metadata.create_all(bind=db_manager.engine)
    except Exception as e:
        logger.error(f"Error creating tables in MySQL: {e}")

    # Update environment variables
    os.environ["MYSQL_HOST"] = req.host
    os.environ["MYSQL_PORT"] = str(req.port)
    os.environ["MYSQL_USER"] = req.user
    os.environ["MYSQL_PASSWORD"] = req.password
    os.environ["MYSQL_DB"] = req.database

    return {
        "success": True,
        "message": f"Successfully connected to MySQL database '{req.database}'!",
        "active_db": "mysql"
    }

@router.post("/llm")
async def configure_llm(
    req: LLMConfigRequest,
    admin: UserRecord = Depends(require_admin_user)
):
    """Tests LLM key with a lightweight completion and activates it."""
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be blank.")

    provider = req.provider.lower()
    test_passed = False
    test_error = None

    if provider == "gemini":
        result = await AIService.call_gemini(
            prompt="Respond with 'LLM_OK' only.",
            api_key=key,
            model=req.model or "gemini-1.5-flash"
        )
        if result and "LLM_OK" in result:
            test_passed = True
            os.environ["GEMINI_API_KEY"] = key
            os.environ["GEMINI_MODEL"] = req.model
            os.environ["LLM_PROVIDER"] = "gemini"
        else:
            test_error = "Failed to verify key with Gemini API. Please check your key."
    elif provider == "openai":
        result = await AIService.call_openai(
            prompt="Respond with 'LLM_OK' only.",
            api_key=key,
            model=req.model or "gpt-4o-mini"
        )
        if result and "LLM_OK" in result:
            test_passed = True
            os.environ["OPENAI_API_KEY"] = key
            os.environ["OPENAI_MODEL"] = req.model
            os.environ["LLM_PROVIDER"] = "openai"
        else:
            test_error = "Failed to verify key with OpenAI API. Please check your key."

    if test_passed:
        return {
            "success": True,
            "message": f"Successfully validated and connected to {provider.capitalize()}!",
            "provider": provider,
            "model": req.model
        }
    else:
        return {
            "success": False,
            "message": test_error or "Validation failed. Offline Smart Engine will remain active."
        }
