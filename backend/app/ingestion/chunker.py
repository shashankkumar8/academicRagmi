import json
from typing import List, Dict, Any
from backend.app.config import settings

def estimate_tokens(text: str) -> int:
    """Fast approximation of token count (approx 4 chars per token for English)."""
    return max(1, len(text) // 4)

def chunk_document_blocks(
    blocks: List[Dict[str, Any]],
    doc_id: str,
    doc_name: str,
    workspace_id: str,
    unit: str = "General"
) -> List[Dict[str, Any]]:
    """Heading-aware parent-child recursive chunker.
    
    Generates child chunks (400-800 tokens) for dense vector search,
    with embedded parent section context for LLM generation.
    """
    min_tokens = settings.CHUNK_MIN_TOKENS
    max_tokens = settings.CHUNK_MAX_TOKENS
    overlap_tokens = int(max_tokens * settings.CHUNK_OVERLAP_PERCENT)
    
    chunks = []
    chunk_index = 0
    
    current_child_blocks = []
    current_tokens = 0
    
    # First, group blocks by major heading sections for parent context
    sections = []
    current_section = []
    current_heading = "General"
    
    for b in blocks:
        if b.get("type") == "heading":
            if current_section:
                sections.append({"heading": current_heading, "blocks": current_section})
                current_section = []
            current_heading = b.get("content", "General")
        current_section.append(b)
        
    if current_section:
        sections.append({"heading": current_heading, "blocks": current_section})
        
    for sec in sections:
        sec_heading = sec["heading"]
        sec_blocks = sec["blocks"]
        
        # Parent context text for the entire section
        parent_text = "\n\n".join(b["content"] for b in sec_blocks)
        
        child_blocks_acc = []
        child_tokens_acc = 0
        
        for b in sec_blocks:
            b_tokens = estimate_tokens(b["content"])
            
            # If block is a table or code block, do not split it internally
            if b.get("type") in ["table", "code"]:
                if child_blocks_acc:
                    # Flush accumulated text first
                    child_chunk = build_chunk(
                        child_blocks_acc, chunk_index, doc_id, doc_name, workspace_id,
                        unit, sec_heading, parent_text
                    )
                    chunks.append(child_chunk)
                    chunk_index += 1
                    child_blocks_acc = []
                    child_tokens_acc = 0
                    
                # Table as its own chunk
                table_chunk = build_chunk(
                    [b], chunk_index, doc_id, doc_name, workspace_id,
                    unit, sec_heading, parent_text, chunk_type="table"
                )
                chunks.append(table_chunk)
                chunk_index += 1
                continue

            if child_tokens_acc + b_tokens > max_tokens and child_blocks_acc:
                # Flush current child chunk
                child_chunk = build_chunk(
                    child_blocks_acc, chunk_index, doc_id, doc_name, workspace_id,
                    unit, sec_heading, parent_text
                )
                chunks.append(child_chunk)
                chunk_index += 1
                
                # Keep overlap blocks if possible
                overlap_acc = []
                acc_t = 0
                for prev_b in reversed(child_blocks_acc):
                    t = estimate_tokens(prev_b["content"])
                    if acc_t + t <= overlap_tokens:
                        overlap_acc.insert(0, prev_b)
                        acc_t += t
                    else:
                        break
                        
                child_blocks_acc = overlap_acc
                child_tokens_acc = acc_t
                
            child_blocks_acc.append(b)
            child_tokens_acc += b_tokens
            
        if child_blocks_acc:
            child_chunk = build_chunk(
                child_blocks_acc, chunk_index, doc_id, doc_name, workspace_id,
                unit, sec_heading, parent_text
            )
            chunks.append(child_chunk)
            chunk_index += 1
            
    return chunks

def build_chunk(
    blocks: List[Dict[str, Any]],
    chunk_index: int,
    doc_id: str,
    doc_name: str,
    workspace_id: str,
    unit: str,
    heading_path: str,
    parent_text: str,
    chunk_type: str = "text"
) -> Dict[str, Any]:
    """Assemble chunk dictionary with bounding boxes and metadata."""
    content = "\n\n".join(b["content"] for b in blocks)
    pages = [b["page"] for b in blocks if "page" in b]
    page_start = min(pages) if pages else 1
    page_end = max(pages) if pages else 1
    
    bboxes = [b.get("bbox", [0, 0, 1, 1]) for b in blocks if "bbox" in b]
    confidences = [b.get("ocr_confidence", 1.0) for b in blocks if "ocr_confidence" in b]
    avg_conf = (sum(confidences) / len(confidences)) if confidences else 1.0
    
    # Determine dominant chunk type
    types = [b.get("type", "text") for b in blocks]
    if "equation" in types:
        dominant_type = "equation"
    elif "table" in types:
        dominant_type = "table"
    else:
        dominant_type = chunk_type
        
    return {
        "chunk_index": chunk_index,
        "document_id": doc_id,
        "document_name": doc_name,
        "workspace_id": workspace_id,
        "unit": unit,
        "heading_path": heading_path,
        "page_start": page_start,
        "page_end": page_end,
        "chunk_type": dominant_type,
        "content": content,
        "parent_content": parent_text,
        "bbox_json": json.dumps(bboxes),
        "token_count": estimate_tokens(content),
        "ocr_confidence": round(avg_conf, 3)
    }
