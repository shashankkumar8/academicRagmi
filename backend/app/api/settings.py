from typing import Optional, Literal
from pydantic import BaseModel
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.generation.llm_provider import get_llm_provider

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdateSchema(BaseModel):
    default_llm_provider: Optional[Literal["ollama", "openai", "gemini"]] = None
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    low_memory_mode: Optional[bool] = None
    relevance_score_threshold: Optional[float] = None

class LLMTestRequestSchema(BaseModel):
    provider: Literal["ollama", "openai", "gemini"]
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None

@router.get("")
def get_settings():
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "default_llm_provider": settings.DEFAULT_LLM_PROVIDER,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "ollama_model": settings.OLLAMA_MODEL,
        "openai_model": settings.OPENAI_MODEL,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "gemini_model": settings.GEMINI_MODEL,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "low_memory_mode": settings.LOW_MEMORY_MODE,
        "relevance_score_threshold": settings.RELEVANCE_SCORE_THRESHOLD,
        "embedding_model_default": settings.EMBEDDING_MODEL_DEFAULT,
        "embedding_model_multilingual": settings.EMBEDDING_MODEL_MULTILINGUAL,
        "reranker_model": settings.RERANKER_MODEL,
        "data_dir": str(settings.DATA_DIR)
    }

@router.put("")
def update_settings(payload: SettingsUpdateSchema):
    if payload.default_llm_provider is not None:
        settings.DEFAULT_LLM_PROVIDER = payload.default_llm_provider
    if payload.ollama_base_url is not None:
        settings.OLLAMA_BASE_URL = payload.ollama_base_url
    if payload.ollama_model is not None:
        settings.OLLAMA_MODEL = payload.ollama_model
    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key
    if payload.openai_model is not None:
        settings.OPENAI_MODEL = payload.openai_model
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key
    if payload.gemini_model is not None:
        settings.GEMINI_MODEL = payload.gemini_model
    if payload.low_memory_mode is not None:
        settings.LOW_MEMORY_MODE = payload.low_memory_mode
    if payload.relevance_score_threshold is not None:
        settings.RELEVANCE_SCORE_THRESHOLD = payload.relevance_score_threshold
        
    return {"message": "Settings updated successfully", "settings": get_settings()}

@router.post("/test-llm")
async def test_llm_connection(payload: LLMTestRequestSchema):
    provider = get_llm_provider(
        provider_name=payload.provider,
        api_key=payload.api_key,
        model=payload.model,
        base_url=payload.base_url
    )
    result = await provider.test_connection()
    return result
