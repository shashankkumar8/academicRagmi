from pathlib import Path
from typing import List, Dict, Any, Tuple
import pdfplumber
from backend.app.core.logging import logger

def table_to_markdown(table_data: List[List[Any]]) -> str:
    """Convert 2D table array into Markdown formatted table."""
    if not table_data or len(table_data) < 1:
        return ""
    
    # Filter empty rows and sanitize cells
    cleaned_rows = []
    for row in table_data:
        if not row:
            continue
        cleaned = [str(cell).strip().replace("\n", " ").replace("|", "\\|") if cell is not None else "" for cell in row]
        if any(cleaned):
            cleaned_rows.append(cleaned)
            
    if not cleaned_rows:
        return ""
        
    num_cols = max(len(r) for r in cleaned_rows)
    # Pad rows
    for r in cleaned_rows:
        while len(r) < num_cols:
            r.append("")
            
    headers = cleaned_rows[0]
    separator = ["---"] * num_cols
    
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(separator) + " |"
    ]
    
    for row in cleaned_rows[1:]:
        lines.append("| " + " | ".join(row) + " |")
        
    return "\n".join(lines)

def extract_tables_from_page(pdf_path: Path, page_num_0_indexed: int) -> List[Dict[str, Any]]:
    """Extract tables from a single page using pdfplumber with Markdown and bounding boxes."""
    results = []
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            if page_num_0_indexed >= len(pdf.pages):
                return []
            page = pdf.pages[page_num_0_indexed]
            tables = page.find_tables()
            
            page_w = float(page.width)
            page_h = float(page.height)
            
            for t in tables:
                extracted = t.extract()
                md = table_to_markdown(extracted)
                if md:
                    bbox = t.bbox  # (x0, top, x1, bottom)
                    norm_bbox = [
                        round(bbox[0] / page_w, 4),
                        round(bbox[1] / page_h, 4),
                        round(bbox[2] / page_w, 4),
                        round(bbox[3] / page_h, 4)
                    ]
                    results.append({
                        "markdown": md,
                        "bbox": norm_bbox,
                        "raw_bbox": bbox
                    })
    except Exception as e:
        logger.warning("Error extracting tables from %s page %s: %s", pdf_path.name, page_num_0_indexed + 1, str(e))
    return results
