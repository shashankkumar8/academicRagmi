import re
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import fitz  # PyMuPDF
from backend.app.ingestion.ocr import is_page_scanned, ocr_page
from backend.app.ingestion.tables import extract_tables_from_page
from backend.app.core.logging import logger

EQUATION_PATTERNS = [
    r'[a-zA-Z]\s*=\s*[-+]?[0-9a-zA-Z\(\)\/]+',
    r'\\int|\\sum|\\prod|\\sqrt|\\alpha|\\beta|\\gamma|\\theta|\\partial|\\nabla|\\lambda',
    r'\b(sin|cos|tan|log|exp|lim)\b.*[\(\)=]',
    r'(\w+)\^2\s*\+\s*(\w+)\^2',
    r'd[xyz]\/dt',
]

def is_equation_block(text: str) -> bool:
    """Determine if a text block contains a mathematical formula or equation."""
    if len(text.strip()) > 300:
        return False
    for pat in EQUATION_PATTERNS:
        if re.search(pat, text):
            return True
    return False

def is_header_or_footer(bbox: List[float], text: str, page_height: float) -> bool:
    """Detect repetitive header/footer margins (top 5% or bottom 5% of page)."""
    y0 = bbox[1]
    y1 = bbox[3]
    if y0 < 0.05 or y1 > 0.95:
        # Check if text is short (like page number or title)
        if len(text.strip()) < 60:
            return True
    return False

def extract_pdf_layout(pdf_path: Path) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Perform layout-aware block extraction across all pages of a PDF.
    
    Returns:
        (blocks_list, parse_report)
    """
    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    
    all_blocks = []
    ocr_pages_count = 0
    tables_count = 0
    low_confidence_pages = []
    warnings = []
    
    current_heading_path = "Introduction"
    
    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_num = page_idx + 1
        page_w = float(page.rect.width)
        page_h = float(page.rect.height)
        
        # 1. Check if page is scanned
        scanned = is_page_scanned(page)
        if scanned:
            ocr_pages_count += 1
            text, conf, ocr_boxes = ocr_page(page)
            if conf < 0.60:
                low_confidence_pages.append(page_num)
                warnings.append(f"Page {page_num} OCR confidence is low ({int(conf * 100)}%).")
                
            if text:
                all_blocks.append({
                    "page": page_num,
                    "type": "text",
                    "content": text,
                    "heading_path": current_heading_path,
                    "bbox": [0.05, 0.05, 0.95, 0.95],
                    "ocr_confidence": conf
                })
            continue

        # 2. Extract tables for this page
        page_tables = extract_tables_from_page(pdf_path, page_idx)
        tables_count += len(page_tables)
        for tbl in page_tables:
            all_blocks.append({
                "page": page_num,
                "type": "table",
                "content": tbl["markdown"],
                "heading_path": current_heading_path,
                "bbox": tbl["bbox"],
                "ocr_confidence": 1.0
            })
            
        # 3. Extract text blocks and headings with PyMuPDF
        text_page = page.get_text("dict")
        blocks = text_page.get("blocks", [])
        
        for b in blocks:
            if b.get("type") != 0:  # 0 is text block
                continue
                
            bbox = b.get("bbox", [0, 0, 0, 0])
            norm_bbox = [
                round(bbox[0] / page_w, 4),
                round(bbox[1] / page_h, 4),
                round(bbox[2] / page_w, 4),
                round(bbox[3] / page_h, 4)
            ]
            
            # Combine lines and spans
            block_lines = []
            max_font_size = 0.0
            is_bold = False
            
            for line in b.get("lines", []):
                line_text = ""
                for span in line.get("spans", []):
                    span_text = span.get("text", "")
                    line_text += span_text
                    size = span.get("size", 10.0)
                    if size > max_font_size:
                        max_font_size = size
                    flags = span.get("flags", 0)
                    if flags & 2 != 0 or "bold" in span.get("font", "").lower():
                        is_bold = True
                block_lines.append(line_text)
                
            full_text = " ".join(block_lines).strip()
            if not full_text:
                continue
                
            # Filter headers / footers
            if is_header_or_footer(norm_bbox, full_text, page_h):
                continue
                
            # Heading detection heuristics (e.g. font size >= 13pt or bold short line)
            if max_font_size >= 13.0 or (is_bold and len(full_text) < 80 and not full_text.endswith('.')):
                current_heading_path = full_text
                block_type = "heading"
            elif is_equation_block(full_text):
                block_type = "equation"
            else:
                block_type = "text"
                
            all_blocks.append({
                "page": page_num,
                "type": block_type,
                "content": full_text,
                "heading_path": current_heading_path,
                "bbox": norm_bbox,
                "ocr_confidence": 1.0
            })
            
    doc.close()
    
    parse_report = {
        "total_pages": total_pages,
        "ocr_pages_count": ocr_pages_count,
        "tables_count": tables_count,
        "low_confidence_pages": low_confidence_pages,
        "warnings": warnings,
        "blocks_count": len(all_blocks)
    }
    
    return all_blocks, parse_report
