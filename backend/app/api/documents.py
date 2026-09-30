import io
import json
import asyncio
from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.deps import get_current_db
from backend.app.db.models import Workspace, Document, DocumentChunk, IngestionJob
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.core.security import sanitize_workspace_id
from backend.app.ingestion.loader import save_uploaded_pdf
from backend.app.ingestion.pipeline import (
    process_document_ingestion, 
    subscribe_job_events, 
    unsubscribe_job_events
)
from backend.app.retrieval.vectorstore import vector_store

router = APIRouter(tags=["Documents & Ingestion"])

@router.post("/workspaces/{workspace_id}/documents", status_code=status.HTTP_202_ACCEPTED)
async def upload_documents(
    workspace_id: str,
    files: List[UploadFile] = File(...),
    unit: str = Form("General"),
    db: Session = Depends(get_current_db)
):
    clean_ws_id = sanitize_workspace_id(workspace_id)
    ws = db.query(Workspace).filter(Workspace.id == clean_ws_id).first()
    if not ws:
        raise NotFoundError(f"Workspace '{workspace_id}' not found.")
        
    created_jobs = []
    
    for upload in files:
        content = await upload.read()
        target_path, safe_name, sha256_hash, file_size = save_uploaded_pdf(
            workspace_id=clean_ws_id,
            filename=upload.filename or "document.pdf",
            content=content
        )
        
        # Check if already exists in workspace
        existing_doc = db.query(Document).filter(
            Document.workspace_id == clean_ws_id,
            Document.sha256_hash == sha256_hash
        ).first()
        
        if existing_doc:
            doc = existing_doc
            doc.status = "queued"
            db.commit()
        else:
            doc = Document(
                workspace_id=clean_ws_id,
                filename=safe_name,
                original_filename=upload.filename or safe_name,
                file_path=str(target_path),
                file_size_bytes=file_size,
                sha256_hash=sha256_hash,
                unit=unit or "General",
                status="queued"
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            
        job = IngestionJob(
            workspace_id=clean_ws_id,
            document_id=doc.id,
            status="queued",
            stage_progress=0.0,
            current_stage_label="Queued for processing..."
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Launch async ingestion task immediately
        asyncio.create_task(
            process_document_ingestion(
                job_id=job.id,
                document_id=doc.id,
                workspace_id=clean_ws_id,
                pdf_path=target_path,
                original_filename=upload.filename or safe_name,
                unit=unit
            )
        )
        
        created_jobs.append({
            "job_id": job.id,
            "document_id": doc.id,
            "filename": doc.original_filename,
            "status": "queued"
        })
        
    return {
        "message": f"Queued {len(created_jobs)} document(s) for ingestion",
        "jobs": created_jobs
    }

@router.get("/workspaces/{workspace_id}/documents")
def list_documents(workspace_id: str, db: Session = Depends(get_current_db)):
    clean_ws_id = sanitize_workspace_id(workspace_id)
    docs = db.query(Document).filter(Document.workspace_id == clean_ws_id).order_by(Document.created_at.desc()).all()
    
    results = []
    for d in docs:
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == d.id).count()
        results.append({
            "id": d.id,
            "filename": d.filename,
            "original_filename": d.original_filename,
            "file_size_bytes": d.file_size_bytes,
            "page_count": d.page_count,
            "unit": d.unit,
            "status": d.status,
            "chunk_count": chunk_count,
            "ocr_pages_count": d.ocr_pages_count,
            "tables_count": d.tables_count,
            "low_confidence_pages": json.loads(d.low_confidence_pages or "[]"),
            "warnings": json.loads(d.warnings or "[]"),
            "created_at": d.created_at.isoformat() if d.created_at else ""
        })
    return results

@router.delete("/workspaces/{workspace_id}/documents/{document_id}")
def delete_document(workspace_id: str, document_id: str, db: Session = Depends(get_current_db)):
    clean_ws_id = sanitize_workspace_id(workspace_id)
    doc = db.query(Document).filter(
        Document.workspace_id == clean_ws_id,
        Document.id == document_id
    ).first()
    
    if not doc:
        raise NotFoundError("Document not found")
        
    # 1. Delete vector embeddings
    vector_store.delete_document(clean_ws_id, document_id)
    
    # 2. Delete raw file
    if doc.file_path and Path(doc.file_path).exists():
        try:
            Path(doc.file_path).unlink(missing_ok=True)
        except Exception:
            pass
            
    # 3. Delete database record (cascade deletes chunks)
    db.delete(doc)
    db.commit()
    return {"message": "Document and all associated embeddings deleted successfully"}

@router.get("/workspaces/{workspace_id}/documents/{document_id}/pages/{page_num}")
def get_rendered_page(
    workspace_id: str,
    document_id: str,
    page_num: int,
    dpi: int = 150,
    db: Session = Depends(get_current_db)
):
    """Render a specific PDF page to high-res PNG for the source viewer."""
    clean_ws_id = sanitize_workspace_id(workspace_id)
    doc = db.query(Document).filter(
        Document.workspace_id == clean_ws_id,
        Document.id == document_id
    ).first()
    
    if not doc or not Path(doc.file_path).exists():
        raise NotFoundError("Document or file not found")
        
    pdf_doc = fitz.open(doc.file_path)
    if page_num < 1 or page_num > len(pdf_doc):
        pdf_doc.close()
        raise ValidationError(f"Invalid page number {page_num}. Document has {len(pdf_doc)} pages.")
        
    page = pdf_doc[page_num - 1]
    pix = page.get_pixmap(dpi=dpi)
    img_bytes = pix.tobytes("png")
    pdf_doc.close()
    
    return Response(content=img_bytes, media_type="image/png")

@router.get("/jobs/{job_id}/events")
async def stream_job_events(job_id: str):
    """Server-Sent Events (SSE) stream for live animated pipeline visualization."""
    q = subscribe_job_events(job_id)

    async def event_generator():
        try:
            while True:
                try:
                    event_data = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                    if event_data.get("stage") in ["indexed", "failed"]:
                        break
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            unsubscribe_job_events(job_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
