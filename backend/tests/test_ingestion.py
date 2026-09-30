import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import init_db
from backend.app.ingestion.layout import extract_pdf_layout
from backend.app.ingestion.chunker import chunk_document_blocks
from backend.app.retrieval.embedder import embed_texts
from backend.app.retrieval.vectorstore import vector_store
from backend.app.retrieval.bm25 import update_bm25_index, search_bm25

SAMPLE_PDF = Path(__file__).resolve().parent.parent / "sample_data" / "quantum_mechanics_intro.pdf"

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_layout_extraction():
    assert SAMPLE_PDF.exists()
    blocks, report = extract_pdf_layout(SAMPLE_PDF)
    
    assert report["total_pages"] == 2
    assert len(blocks) > 0
    # Verify equations or headings detected
    types = [b["type"] for b in blocks]
    assert "heading" in types or "text" in types
    
    # Check normalized bounding boxes are within [0, 1]
    for b in blocks:
        bbox = b["bbox"]
        assert len(bbox) == 4
        assert 0.0 <= bbox[0] <= 1.0
        assert 0.0 <= bbox[1] <= 1.0

def test_parent_child_chunker():
    blocks, report = extract_pdf_layout(SAMPLE_PDF)
    chunks = chunk_document_blocks(
        blocks=blocks,
        doc_id="test_doc_1",
        doc_name="quantum_mechanics_intro.pdf",
        workspace_id="test_ws_1",
        unit="Unit 1"
    )
    
    assert len(chunks) >= 1
    for ch in chunks:
        assert ch["token_count"] > 0
        assert len(ch["parent_content"]) >= len(ch["content"])  # Parent context is superset

def test_embedding_and_vectorstore():
    test_texts = [
        "What is the de Broglie wavelength formula?",
        "Energy eigenvalues of a particle in a 1D box are discrete.",
        "Quantum tunneling allows particles to penetrate rectangular barriers."
    ]
    embeddings = embed_texts(test_texts)
    assert len(embeddings) == 3
    assert len(embeddings[0]) == 384  # 384 dimensions

    # Test ChromaDB indexing and querying
    chunks = [
        {"id": f"chunk_{i}", "content": text, "document_id": "doc_test", "unit": "Unit 1", "page_start": 1, "page_end": 1}
        for i, text in enumerate(test_texts)
    ]
    vector_store.add_chunks("test_ws_embed", chunks, embeddings)
    
    query_emb = embed_texts(["de Broglie wavelength"])[0]
    results = vector_store.query("test_ws_embed", query_emb, top_k=2)
    assert len(results) > 0

def test_bm25_search():
    chunks = [
        {"id": "c1", "content": "The Time-Dependent Schrödinger Equation describes wavefunction evolution.", "document_id": "d1", "unit": "Unit 1", "page_start": 1, "page_end": 1},
        {"id": "c2", "content": "Backpropagation uses gradient descent with learning rate eta.", "document_id": "d2", "unit": "Unit 2", "page_start": 2, "page_end": 2}
    ]
    update_bm25_index("test_ws_bm25", chunks)
    res = search_bm25("test_ws_bm25", "Schrödinger Equation", top_k=1)
    assert len(res) == 1
    assert res[0]["id"] == "c1"
