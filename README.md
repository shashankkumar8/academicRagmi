# 🎓 ScholarRAG: Academic Retrieval-Augmented Generation

**ScholarRAG** is a highly-optimized, local-first hybrid Retrieval-Augmented Generation (RAG) system engineered for academic and professional document analysis. It allows users to upload complex documents (PDFs, PPTXs, TXTs) and instantly query them. By leveraging dense and sparse hybrid search, cross-encoder reranking, and the lightning-fast **Gemini 3.5 Flash** model, ScholarRAG produces accurate, context-aware answers accompanied by verifiably accurate **page-level citations**.

---

## ✨ Key Features

- 🧠 **Hybrid Retrieval Engine**: Fuses Dense Vector Search (ChromaDB + BAAI/bge-small-en-v1.5) with Sparse Lexical Search (BM25Okapi) using Reciprocal Rank Fusion (RRF) for unparalleled search recall.
- 🎯 **Cross-Encoder Reranking**: Utilizes `BAAI/bge-reranker-base` to strictly score and re-order the retrieved chunks, ensuring that the LLM only sees the most relevant text.
- 💬 **Real-time Streaming**: Streams generative responses instantly to the client via Server-Sent Events (SSE).
- 📑 **Page-Level Citations**: Answers are backed by source document citations, mapping directly to the exact chunk and page number.
- ⚡ **Gemini 3.5 Flash Integration**: Built-in, natively configured support for Google's newest and fastest generative models.
- 🎨 **Glassmorphism UI**: A stunning, highly responsive React frontend featuring dynamic theming and seamless micro-animations.

---

## 🛠️ Technology Stack

### **Backend (FastAPI)**
- **Framework**: Python 3.12, FastAPI, Uvicorn
- **AI Models**: 
  - Embedding: `BAAI/bge-small-en-v1.5`
  - Reranker: `BAAI/bge-reranker-base`
  - Generation: Google Gemini (`gemini-3.5-flash`)
- **Database & Storage**: SQLite (SQLModel), ChromaDB
- **Document Processing**: PyMuPDF (`fitz`), `python-pptx`, LangChain Text Splitters

### **Frontend (React)**
- **Framework**: React 18, Vite, TypeScript
- **Styling**: TailwindCSS, Radix UI, Lucide Icons
- **State Management**: Zustand
- **Network**: Native `fetch` with Server-Sent Events (SSE) streaming.

---

## 🏗️ Architecture Flow

1. **Ingestion**: Documents are parsed, split into semantically coherent chunks, embedded via `bge-small`, and indexed into ChromaDB (dense) and BM25 (sparse).
2. **Retrieval**: A user query retrieves top chunks from both indexes. The results are mathematically fused (RRF).
3. **Reranking**: The `bge-reranker-base` cross-encoder compares the user query against the top fused chunks to output a precise relevance score, discarding irrelevant data.
4. **Generation**: The absolute best chunks are injected into a strict system prompt and streamed through `gemini-3.5-flash`.
5. **Consumption**: The frontend listens to the SSE stream, rendering tokens instantly alongside dynamic citation cards.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.11 or 3.12
- **Node.js**: 18+ and `npm`
- **Gemini API Key**: Obtainable from Google AI Studio.

### 2. Clone the Repository
```bash
git clone https://github.com/shreemsri/academicRag.git
cd academicRag
```

### 3. Backend Setup
Navigate to the root directory and create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install the required Python dependencies:
```bash
pip install -r backend/requirements.txt
```

**Environment Variables:**
Create a `.env` file in the root directory:
```env
DEFAULT_LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the FastAPI server (runs on `http://localhost:8001`):
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001
```
*(Note: On first boot, the system will download the embedding and reranker models from HuggingFace. This may take a few minutes depending on your internet connection.)*

### 4. Frontend Setup
Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
Navigate to `http://localhost:5174` in your browser to access the application.

---

## 🧪 Testing

The repository includes automated testing scripts for the core logic:
- `test_upload.py`: Tests the ingestion pipeline (PDF parsing, chunking, and embedding).
- `test_qa.py`: Tests the retrieval engine and Gemini LLM streaming integration directly from the terminal.

Run them via:
```bash
source venv/bin/activate
python test_qa.py
```

---
*Built for the future of academic research.*
