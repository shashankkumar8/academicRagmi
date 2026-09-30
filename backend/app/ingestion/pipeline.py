import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.db.session import SessionLocal
from backend.app.db.models import Document, DocumentChunk, IngestionJob, Workspace
from backend.app.ingestion.layout import extract_pdf_layout
from backend.app.ingestion.chunker import chunk_document_blocks
from backend.app.retrieval.embedder import embed_texts
from backend.app.retrieval.vectorstore import vector_store
from backend.app.retrieval.bm25 import update_bm25_index

# In-memory SSE queues for real-time progress broadcast
_job_subscribers: Dict[str, List[asyncio.Queue]] = {}

def subscribe_job_events(job_id: str) -> asyncio.Queue:
    if job_id not in _job_subscribers:
        _job_subscribers[job_id] = []
    q = asyncio.Queue()
    _job_subscribers[job_id].append(q)
    return q

def unsubscribe_job_events(job_id: str, q: asyncio.Queue) -> None:
    if job_id in _job_subscribers:
        if q in _job_subscribers[job_id]:
            _job_subscribers[job_id].remove(q)
        if not _job_subscribers[job_id]:
            _job_subscribers.pop(job_id, None)

async def emit_job_event(job_id: str, stage: str, progress: float, label: str, data: Optional[Dict[str, Any]] = None):
    """Publish an ingestion stage event to all active SSE subscribers."""
    payload = {
        "job_id": job_id,
        "stage": stage,
        "progress": round(progress, 1),
        "label": label,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data or {}
    }
    logger.info("Ingestion Job [%s] -> %s (%.1f%%) - %s", job_id[:8], stage.upper(), progress, label)
    if job_id in _job_subscribers:
        for q in _job_subscribers[job_id]:
            await q.put(payload)

async def process_document_ingestion(
    job_id: str,
    document_id: str,
    workspace_id: str,
    pdf_path: Path,
    original_filename: str,
    unit: str = "General"
) -> None:
    """Asynchronous ingestion pipeline coordinating extraction, chunking, and indexing."""
    db: Session = SessionLocal()
    try:
        job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
        doc = db.query(Document).filter(Document.id == document_id).first()
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        
        if not job or not doc:
            logger.error("Job %s or Document %s not found in DB", job_id, document_id)
            return

        # Stage 1: Uploaded & Validated
        job.status = "upload"
        job.stage_progress = 10.0
        job.current_stage_label = "File validated and stored"
        db.commit()
        await emit_job_event(job_id, "upload", 10.0, "File validated and stored on disk")
        await asyncio.sleep(0.2)

        # Stage 2: Layout Parsing & OCR Detection
        job.status = "parse"
        job.stage_progress = 25.0
        job.current_stage_label = "Analyzing layout and reading text blocks..."
        db.commit()
        await emit_job_event(job_id, "parse", 25.0, "Extracting text, headings, and tables")

        # Run extraction in worker thread
        blocks, report = await asyncio.to_thread(extract_pdf_layout, pdf_path)
        
        job.total_pages = report["total_pages"]
        job.processed_pages = report["total_pages"]
        doc.page_count = report["total_pages"]
        doc.ocr_pages_count = report["ocr_pages_count"]
        doc.tables_count = report["tables_count"]
        doc.low_confidence_pages = json.dumps(report["low_confidence_pages"])
        doc.warnings = json.dumps(report["warnings"])
        doc.parse_report = json.dumps(report)
        db.commit()

        # Stage 3: OCR (if any scanned pages detected)
        if report["ocr_pages_count"] > 0:
            job.status = "ocr"
            job.stage_progress = 40.0
            job.current_stage_label = f"OCR processed {report['ocr_pages_count']} scanned page(s)"
            db.commit()
            await emit_job_event(job_id, "ocr", 40.0, f"OCR completed on {report['ocr_pages_count']} scanned page(s)", {"ocr_count": report["ocr_pages_count"]})
        else:
            job.stage_progress = 40.0
            db.commit()
            await emit_job_event(job_id, "ocr", 40.0, "Native digital PDF verified (OCR skipped)")

        # Stage 4: Heading-Aware Chunking
        job.status = "chunk"
        job.stage_progress = 60.0
        job.current_stage_label = "Generating heading-aware parent-child chunks..."
        db.commit()
        await emit_job_event(job_id, "chunk", 60.0, "Splitting into parent-child passages")

        raw_chunks = chunk_document_blocks(
            blocks=blocks,
            doc_id=doc.id,
            doc_name=original_filename,
            workspace_id=workspace_id,
            unit=unit
        )
        
        job.total_chunks = len(raw_chunks)
        db.commit()

        # Store chunks in SQLite
        db_chunks = []
        for rc in raw_chunks:
            chunk_obj = DocumentChunk(
                document_id=doc.id,
                workspace_id=workspace_id,
                chunk_index=rc["chunk_index"],
                chunk_type=rc["chunk_type"],
                heading_path=rc["heading_path"],
                page_start=rc["page_start"],
                page_end=rc["page_end"],
                content=rc["content"],
                parent_content=rc["parent_content"],
                bbox_json=rc["bbox_json"],
                token_count=rc["token_count"],
                ocr_confidence=rc["ocr_confidence"]
            )
            db.add(chunk_obj)
            db_chunks.append(chunk_obj)
            
        db.commit()
        # Refresh to get generated IDs
        for ch in db_chunks:
            db.refresh(ch)

        # Stage 5: Dense Vector Embedding
        job.status = "embed"
        job.stage_progress = 80.0
        job.current_stage_label = f"Embedding {len(raw_chunks)} chunks with BGE model on CPU..."
        db.commit()
        await emit_job_event(job_id, "embed", 80.0, f"Computing dense embeddings for {len(raw_chunks)} chunks")

        texts_to_embed = [c.content for c in db_chunks]
        emb_model = settings.EMBEDDING_MODEL_MULTILINGUAL if (ws and ws.mode == "multilingual") else settings.EMBEDDING_MODEL_DEFAULT
        
        embeddings = await asyncio.to_thread(embed_texts, texts_to_embed, emb_model)

        # Stage 6: Vector & BM25 Indexing
        job.status = "index"
        job.stage_progress = 95.0
        job.current_stage_label = "Writing to ChromaDB and BM25 index..."
        db.commit()
        await emit_job_event(job_id, "index", 95.0, "Persisting to ChromaDB and updating BM25 index")

        chunks_for_chroma = [
            {
                "id": ch.id,
                "content": ch.content,
                "document_id": doc.id,
                "document_name": original_filename,
                "unit": unit,
                "heading_path": ch.heading_path,
                "page_start": ch.page_start,
                "page_end": ch.page_end,
                "chunk_type": ch.chunk_type,
                "ocr_confidence": ch.ocr_confidence
            }
            for ch in db_chunks
        ]
        
        vector_store.add_chunks(workspace_id, chunks_for_chroma, embeddings)

        # Update BM25 index
        # Note: DocumentChunk has no 'unit' column — unit is on Document.
        # We join Document to get the unit for each chunk.
        all_ws_chunks = (
            db.query(DocumentChunk, Document.unit)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(DocumentChunk.workspace_id == workspace_id)
            .all()
        )
        chunks_for_bm25 = [
            {
                "id": c.id,
                "content": c.content,
                "document_id": c.document_id,
                "document_name": original_filename,
                "unit": chunk_unit or "General",
                "heading_path": c.heading_path,
                "page_start": c.page_start,
                "page_end": c.page_end,
                "chunk_type": c.chunk_type
            }
            for c, chunk_unit in all_ws_chunks
        ]
        update_bm25_index(workspace_id, chunks_for_bm25)

        # Final Completion
        doc.status = "indexed"
        job.status = "indexed"
        job.stage_progress = 100.0
        job.current_stage_label = "Indexed and ready for academic Q&A!"
        db.commit()

        await emit_job_event(
            job_id, "indexed", 100.0, "Document successfully indexed!",
            {
                "document_id": doc.id,
                "total_pages": report["total_pages"],
                "total_chunks": len(raw_chunks),
                "tables_count": report["tables_count"],
                "ocr_pages_count": report["ocr_pages_count"],
                "warnings": report["warnings"]
            }
        )

    except Exception as e:
        logger.exception("Ingestion failed for job %s: %s", job_id, str(e))
        if 'doc' in locals() and doc:
            doc.status = "failed"
        if 'job' in locals() and job:
            job.status = "failed"
            job.error_message = str(e)
            job.current_stage_label = f"Ingestion error: {str(e)}"
        db.commit()
        await emit_job_event(job_id, "failed", 0.0, f"Ingestion error: {str(e)}")
    finally:
        db.close()
