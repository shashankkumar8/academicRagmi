from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse

class ScholarRAGError(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

class NotFoundError(ScholarRAGError):
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message=message, code="NOT_FOUND", status_code=status.HTTP_404_NOT_FOUND, details=details)

class ValidationError(ScholarRAGError):
    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(message=message, code="VALIDATION_ERROR", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)

class IngestionError(ScholarRAGError):
    def __init__(self, message: str = "Document ingestion failed", details: Optional[Any] = None):
        super().__init__(message=message, code="INGESTION_ERROR", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

class LLMProviderError(ScholarRAGError):
    def __init__(self, message: str = "LLM provider call failed", details: Optional[Any] = None):
        super().__init__(message=message, code="LLM_PROVIDER_ERROR", status_code=status.HTTP_502_BAD_GATEWAY, details=details)

async def app_exception_handler(request: Request, exc: ScholarRAGError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "details": exc.details
        }
    )
