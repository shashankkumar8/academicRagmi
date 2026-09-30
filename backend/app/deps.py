from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.generation.llm_provider import get_llm_provider, LLMProvider

def get_current_db() -> Generator[Session, None, None]:
    yield from get_db()

def get_default_llm() -> LLMProvider:
    return get_llm_provider()
