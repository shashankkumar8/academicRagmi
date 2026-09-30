import hashlib
from pathlib import Path
from typing import Tuple
from backend.app.config import settings
from backend.app.core.security import validate_pdf_bytes, sanitize_filename
from backend.app.core.errors import ValidationError

def compute_sha256(content: bytes) -> str:
    """Calculate SHA-256 hash of raw file bytes for deduplication."""
    return hashlib.sha256(content).hexdigest()

def save_uploaded_pdf(workspace_id: str, filename: str, content: bytes) -> Tuple[Path, str, str, int]:
    """Validate, sanitize, and save an uploaded PDF to workspace storage.
    
    Returns:
        (saved_path, sanitized_filename, sha256_hash, file_size_bytes)
    """
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    validate_pdf_bytes(content, max_bytes)
    
    safe_name = sanitize_filename(filename)
    sha256_hash = compute_sha256(content)
    
    ws_raw_dir = settings.DATA_DIR / "workspaces" / workspace_id / "raw"
    ws_raw_dir.mkdir(parents=True, exist_ok=True)
    
    target_path = ws_raw_dir / f"{sha256_hash[:12]}_{safe_name}"
    with open(target_path, "wb") as f:
        f.write(content)
        
    return target_path, safe_name, sha256_hash, len(content)
