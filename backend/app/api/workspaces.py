from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.deps import get_current_db
from backend.app.db.models import Workspace, Document, DocumentChunk
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.core.security import sanitize_workspace_id
from backend.app.config import settings
import shutil

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

class WorkspaceCreateSchema(BaseModel):
    name: str
    description: Optional[str] = ""
    mode: Optional[str] = "standard"  # standard | multilingual
    color_theme: Optional[str] = "violet"  # violet, amber, mint, sky, coral, rose
    icon: Optional[str] = "book"

class WorkspaceUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mode: Optional[str] = None
    color_theme: Optional[str] = None
    icon: Optional[str] = None

class WorkspaceResponseSchema(BaseModel):
    id: str
    name: str
    description: str
    mode: str
    color_theme: str
    icon: str
    document_count: int
    total_pages: int
    total_chunks: int
    total_size_bytes: int
    created_at: str
    updated_at: str

@router.get("", response_model=List[WorkspaceResponseSchema])
def list_workspaces(db: Session = Depends(get_current_db)):
    workspaces = db.query(Workspace).order_by(Workspace.updated_at.desc()).all()
    results = []
    for ws in workspaces:
        doc_count = len(ws.documents)
        total_pages = sum(d.page_count for d in ws.documents)
        total_size = sum(d.file_size_bytes for d in ws.documents)
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.workspace_id == ws.id).count()
        
        results.append(
            WorkspaceResponseSchema(
                id=ws.id,
                name=ws.name,
                description=ws.description or "",
                mode=ws.mode or "standard",
                color_theme=ws.color_theme or "violet",
                icon=ws.icon or "book",
                document_count=doc_count,
                total_pages=total_pages,
                total_chunks=chunk_count,
                total_size_bytes=total_size,
                created_at=ws.created_at.isoformat() if ws.created_at else "",
                updated_at=ws.updated_at.isoformat() if ws.updated_at else ""
            )
        )
    return results

@router.post("", response_model=WorkspaceResponseSchema, status_code=status.HTTP_201_CREATED)
def create_workspace(payload: WorkspaceCreateSchema, db: Session = Depends(get_current_db)):
    if not payload.name.strip():
        raise ValidationError("Workspace name cannot be empty.")
        
    workspace = Workspace(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else "",
        mode=payload.mode or "standard",
        color_theme=payload.color_theme or "violet",
        icon=payload.icon or "book"
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    
    # Create workspace raw storage directory
    ws_dir = settings.DATA_DIR / "workspaces" / workspace.id / "raw"
    ws_dir.mkdir(parents=True, exist_ok=True)
    
    return WorkspaceResponseSchema(
        id=workspace.id,
        name=workspace.name,
        description=workspace.description,
        mode=workspace.mode,
        color_theme=workspace.color_theme,
        icon=workspace.icon,
        document_count=0,
        total_pages=0,
        total_chunks=0,
        total_size_bytes=0,
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat()
    )

@router.get("/{workspace_id}", response_model=WorkspaceResponseSchema)
def get_workspace(workspace_id: str, db: Session = Depends(get_current_db)):
    clean_id = sanitize_workspace_id(workspace_id)
    ws = db.query(Workspace).filter(Workspace.id == clean_id).first()
    if not ws:
        raise NotFoundError(f"Workspace '{workspace_id}' not found.")
        
    doc_count = len(ws.documents)
    total_pages = sum(d.page_count for d in ws.documents)
    total_size = sum(d.file_size_bytes for d in ws.documents)
    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.workspace_id == ws.id).count()
    
    return WorkspaceResponseSchema(
        id=ws.id,
        name=ws.name,
        description=ws.description or "",
        mode=ws.mode or "standard",
        color_theme=ws.color_theme or "violet",
        icon=ws.icon or "book",
        document_count=doc_count,
        total_pages=total_pages,
        total_chunks=chunk_count,
        total_size_bytes=total_size,
        created_at=ws.created_at.isoformat() if ws.created_at else "",
        updated_at=ws.updated_at.isoformat() if ws.updated_at else ""
    )

@router.delete("/{workspace_id}", status_code=status.HTTP_200_OK)
def delete_workspace(workspace_id: str, db: Session = Depends(get_current_db)):
    clean_id = sanitize_workspace_id(workspace_id)
    ws = db.query(Workspace).filter(Workspace.id == clean_id).first()
    if not ws:
        raise NotFoundError(f"Workspace '{workspace_id}' not found.")
        
    # Remove files
    ws_dir = settings.DATA_DIR / "workspaces" / ws.id
    if ws_dir.exists():
        shutil.rmtree(ws_dir, ignore_errors=True)
        
    db.delete(ws)
    db.commit()
    return {"message": f"Workspace '{clean_id}' deleted successfully."}
