from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.app.config import settings
from backend.app.core.logging import logger

class VectorStore(ABC):
    @abstractmethod
    def add_chunks(self, workspace_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        pass

    @abstractmethod
    def query(self, workspace_id: str, query_embedding: List[float], top_k: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete_document(self, workspace_id: str, document_id: str) -> None:
        pass

    @abstractmethod
    def delete_workspace(self, workspace_id: str) -> None:
        pass

class ChromaVectorStore(VectorStore):
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=str(settings.CHROMA_PERSIST_DIR),
            settings=ChromaSettings(anonymized_telemetry=False)
        )

    def _get_collection_name(self, workspace_id: str) -> str:
        # Chroma collection names must be 3-63 characters alphanumeric
        safe_id = workspace_id.replace("-", "_")
        return f"ws_{safe_id}"[:63]

    def _get_or_create_collection(self, workspace_id: str):
        col_name = self._get_collection_name(workspace_id)
        return self.client.get_or_create_collection(
            name=col_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_chunks(self, workspace_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        if not chunks or not embeddings:
            return
        collection = self._get_or_create_collection(workspace_id)
        
        ids = [c["id"] for c in chunks]
        documents = [c["content"] for c in chunks]
        metadatas = [
            {
                "chunk_id": c["id"],
                "document_id": c["document_id"],
                "document_name": c.get("document_name", ""),
                "workspace_id": workspace_id,
                "unit": c.get("unit", "General"),
                "heading_path": c.get("heading_path", ""),
                "page_start": c.get("page_start", 1),
                "page_end": c.get("page_end", 1),
                "chunk_type": c.get("chunk_type", "text"),
                "ocr_confidence": float(c.get("ocr_confidence", 1.0))
            }
            for c in chunks
        ]
        
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def query(self, workspace_id: str, query_embedding: List[float], top_k: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        collection = self._get_or_create_collection(workspace_id)
        where_filter = filters if filters else None
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(1, collection.count())),
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )
        
        output = []
        if results and results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                chunk_id = results["ids"][0][i]
                doc_text = results["documents"][0][i]
                meta = results["metadatas"][0][i]
                distance = results["distances"][0][i]
                # Cosine similarity from cosine distance: similarity = 1 - distance
                similarity = round(1.0 - distance, 4)
                
                output.append({
                    "id": chunk_id,
                    "content": doc_text,
                    "metadata": meta,
                    "dense_score": similarity
                })
        return output

    def delete_document(self, workspace_id: str, document_id: str) -> None:
        try:
            collection = self._get_or_create_collection(workspace_id)
            collection.delete(where={"document_id": document_id})
        except Exception as e:
            logger.warning("Could not delete vectors for document %s: %s", document_id, str(e))

    def delete_workspace(self, workspace_id: str) -> None:
        try:
            col_name = self._get_collection_name(workspace_id)
            self.client.delete_collection(name=col_name)
        except Exception as e:
            logger.warning("Could not delete collection for workspace %s: %s", workspace_id, str(e))

# Singleton vector store instance
vector_store = ChromaVectorStore()
