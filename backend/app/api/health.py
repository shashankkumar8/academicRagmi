import psutil
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.generation.llm_provider import get_llm_provider

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def check_health():
    process = psutil.Process()
    mem_info = process.memory_info()
    sys_mem = psutil.virtual_memory()
    
    provider = get_llm_provider()
    llm_status = await provider.test_connection()
    
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "memory": {
            "process_rss_mb": round(mem_info.rss / (1024 * 1024), 2),
            "system_total_gb": round(sys_mem.total / (1024 * 1024 * 1024), 2),
            "system_available_gb": round(sys_mem.available / (1024 * 1024 * 1024), 2),
            "system_percent_used": sys_mem.percent
        },
        "low_memory_mode": settings.LOW_MEMORY_MODE,
        "llm_provider": settings.DEFAULT_LLM_PROVIDER,
        "llm_connection": llm_status
    }
