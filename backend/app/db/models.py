import json
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    mode = Column(String(32), default="standard")  # standard | multilingual
    color_theme = Column(String(64), default="violet")  # cover gradient theme
    icon = Column(String(64), default="book")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    # Relationships
    documents = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="workspace", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="workspace", cascade="all, delete-orphan")
    revision_notes = relationship("RevisionNote", back_populates="workspace", cascade="all, delete-orphan")
    eval_runs = relationship("EvalRun", back_populates="workspace", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False, index=True)
    page_count = Column(Integer, default=0)
    unit = Column(String(128), default="General")
    
    # Quality and parsing stats
    status = Column(String(32), default="pending")  # pending, parsing, ocr, chunking, embedding, indexed, failed
    ocr_pages_count = Column(Integer, default=0)
    tables_count = Column(Integer, default=0)
    low_confidence_pages = Column(Text, default="[]")  # JSON list of page numbers
    warnings = Column(Text, default="[]")              # JSON list of warning messages
    parse_report = Column(Text, default="{}")          # JSON parse report
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    workspace = relationship("Workspace", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    document_id = Column(String(64), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(64), nullable=False, index=True)
    
    chunk_index = Column(Integer, nullable=False)
    chunk_type = Column(String(32), default="text")  # text, table, equation, code
    heading_path = Column(String(512), default="")
    page_start = Column(Integer, nullable=False)
    page_end = Column(Integer, nullable=False)
    
    content = Column(Text, nullable=False)
    parent_content = Column(Text, default="")        # Larger parent section context
    
    bbox_json = Column(Text, default="[]")           # JSON list of normalized bounding boxes [x0, y0, x1, y1]
    token_count = Column(Integer, default=0)
    ocr_confidence = Column(Float, default=1.0)
    
    created_at = Column(DateTime, default=get_utc_now)
    
    document = relationship("Document", back_populates="chunks")

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), nullable=False, index=True)
    document_id = Column(String(64), nullable=False, index=True)
    status = Column(String(32), default="queued")  # queued, upload, parse, ocr, chunk, embed, indexed, failed
    stage_progress = Column(Float, default=0.0)    # 0.0 to 100.0
    current_stage_label = Column(String(128), default="Initializing...")
    error_message = Column(Text, nullable=True)
    total_pages = Column(Integer, default=0)
    processed_pages = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    unit = Column(String(128), default="General")
    source_chunk_id = Column(String(64), nullable=True)
    source_page = Column(Integer, nullable=True)
    source_doc_name = Column(String(255), nullable=True)
    
    # SM-2 Spaced Repetition fields
    repetition = Column(Integer, default=0)
    interval_days = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    due_date = Column(DateTime, default=get_utc_now)
    
    created_at = Column(DateTime, default=get_utc_now)
    workspace = relationship("Workspace", back_populates="flashcards")

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    unit = Column(String(128), default="General")
    difficulty = Column(String(32), default="medium")
    questions_json = Column(Text, nullable=False)  # JSON list of questions with options, answer, explanation, source
    score = Column(Float, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    workspace = relationship("Workspace", back_populates="quizzes")

class RevisionNote(Base):
    __tablename__ = "revision_notes"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    unit = Column(String(128), nullable=False)
    title = Column(String(255), nullable=False)
    summary_markdown = Column(Text, nullable=False)
    key_formulas_json = Column(Text, default="[]")
    citations_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=get_utc_now)
    
    workspace = relationship("Workspace", back_populates="revision_notes")

class EvalRun(Base):
    __tablename__ = "eval_runs"
    
    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    run_name = Column(String(255), nullable=False)
    config_json = Column(Text, nullable=False)     # JSON config (model, reranker, chunk_size, etc.)
    metrics_json = Column(Text, nullable=False)    # JSON summary metrics (hit_rate, mrr, faithfulness, latency)
    results_json = Column(Text, nullable=False)    # JSON itemized question-level results
    created_at = Column(DateTime, default=get_utc_now)
    
    workspace = relationship("Workspace", back_populates="eval_runs")
