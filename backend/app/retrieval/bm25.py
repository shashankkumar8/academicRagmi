import re
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi

_bm25_cache: Dict[str, Tuple[BM25Okapi, List[Dict[str, Any]]]] = {}

def tokenize(text: str) -> List[str]:
    """Clean and tokenize string into lowercase alphanumeric words."""
    if not text:
        return []
    # Support unicode word characters
    return [t for t in re.findall(r'[\w]+', text.lower(), flags=re.UNICODE) if len(t) > 1]

def update_bm25_index(workspace_id: str, chunks: List[Dict[str, Any]]) -> None:
    """Build or update in-memory BM25 index for a workspace."""
    if not chunks:
        _bm25_cache.pop(workspace_id, None)
        return
    
    corpus = [tokenize(c["content"]) for c in chunks]
    # Ensure at least one token per document
    clean_corpus = [doc if doc else ["empty"] for doc in corpus]
    bm25 = BM25Okapi(clean_corpus)
    _bm25_cache[workspace_id] = (bm25, chunks)

def search_bm25(workspace_id: str, query: str, top_k: int = 20) -> List[Dict[str, Any]]:
    """Execute keyword search over workspace chunks using BM25."""
    if workspace_id not in _bm25_cache:
        return []
        
    bm25, chunks = _bm25_cache[workspace_id]
    tokenized_query = tokenize(query)
    if not tokenized_query:
        return []
        
    scores = bm25.get_scores(tokenized_query)
    
    # Sort descending
    ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    
    results = []
    max_score = max(scores) if any(scores) and max(scores) > 0 else 1.0
    for idx in ranked_indices:
        raw_score = scores[idx]
        if raw_score <= 0 and len(results) > 0:
            continue
        norm_score = round(max(0.0, raw_score / (max_score + 1e-5)), 4)
        c = chunks[idx]
        results.append({
            "id": c["id"],
            "content": c["content"],
            "metadata": {
                "chunk_id": c["id"],
                "document_id": c.get("document_id", ""),
                "document_name": c.get("document_name", ""),
                "workspace_id": workspace_id,
                "unit": c.get("unit", "General"),
                "heading_path": c.get("heading_path", ""),
                "page_start": c.get("page_start", 1),
                "page_end": c.get("page_end", 1),
                "chunk_type": c.get("chunk_type", "text"),
            },
            "bm25_score": norm_score
        })
    return results
