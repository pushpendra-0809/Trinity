import logging
import numpy as np
from typing import List

from .vector_store import CurriculumVectorStore
from .embedder import EmbeddedChunk

logger = logging.getLogger(__name__)

class CurriculumRetriever:
    """
    A semantic retriever that queries the Curriculum FAISS vector store
    using natural language queries.
    """
    def __init__(self):
        """
        Initializes the retriever by setting up the vector store
        and ensuring the FAISS index is built.
        """
        logger.info("Initializing CurriculumRetriever...")
        self.vector_store = CurriculumVectorStore()
        
        # Build the index if it hasn't been built yet
        if self.vector_store.index is None or self.vector_store.total_chunks() == 0:
            logger.info("FAISS index not found. Building index automatically...")
            self.vector_store.build_index()
            
        # We reuse the exact same SentenceTransformer model instance 
        # from the embedder to avoid duplicating memory and initialization time.
        self.model = self.vector_store.embedder.model

    def retrieve(self, query: str, top_k: int = 5) -> List[EmbeddedChunk]:
        """
        Converts a natural language query into an embedding and 
        retrieves the most semantically relevant curriculum chunks.

        Args:
            query (str): The natural language search query.
            top_k (int, optional): Maximum number of results to return. Defaults to 5.

        Returns:
            List[EmbeddedChunk]: A list of the most relevant EmbeddedChunk objects.
        """
        if not query.strip():
            logger.warning("Empty query provided to retrieve(). Returning empty results.")
            return []
            
        logger.info(f"Retrieving top {top_k} chunks for query: '{query}'")
        
        # Encode the natural language query into a vector
        # convert_to_numpy=True ensures we get the right baseline format
        query_embedding = self.model.encode(
            query,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        
        # Ensure it's a 32-bit float numpy array (the vector_store automatically expands it to 2D)
        query_embedding_f32 = np.array(query_embedding, dtype=np.float32)
        
        # Perform the search against the vector store
        results = self.vector_store.search(query_embedding_f32, top_k=top_k)
        
        logger.info(f"Successfully retrieved {len(results)} chunks.")
        return results
