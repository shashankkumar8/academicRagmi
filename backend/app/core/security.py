import re
from pathlib import Path
from backend.app.core.errors import ValidationError

def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filenames to prevent directory traversal and injection attacks."""
    # Remove path separators and null bytes
    cleaned = filename.replace("\\", "/").split("/")[-1]
    cleaned = re.sub(r'[\x00-\x1f\x7f]', '', cleaned)
    cleaned = re.sub(r'[^a-zA-Z0-9._\-\s]', '_', cleaned)
    cleaned = cleaned.strip()
    if not cleaned or cleaned.startswith('.'):
        cleaned = f"doc_{cleaned}" if cleaned else "document.pdf"
    return cleaned

def validate_pdf_bytes(content: bytes, max_size_bytes: int) -> None:
    """Validate file magic bytes and size to block fake PDFs or PDF bombs."""
    if len(content) > max_size_bytes:
        raise ValidationError(
            f"File exceeds maximum allowed size ({max_size_bytes // (1024 * 1024)} MB)"
        )
    if not content.startswith(b"%PDF-"):
        raise ValidationError("Invalid file signature. File is not a valid PDF.")

def sanitize_workspace_id(workspace_id: str) -> str:
    """Validate workspace ID format (alphanumeric and hyphens only)."""
    if not re.match(r'^[a-zA-Z0-9_\-]+$', workspace_id):
        raise ValidationError("Invalid workspace ID format.")
    return workspace_id
