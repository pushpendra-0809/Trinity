import logging
import numpy as np
import faiss
from typing import List, Optional, Any

from .embedder import CurriculumEmbedder, EmbeddedChunk

logger = logging.getLogger(__name__)

class CurriculumVectorStore:
    """
    A FAISS-based vector store for managing and searching Curriculum embedded chunks.
    """
    def __init__(self):
        """
        Initializes the vector store.
        """
        self.index: Optional[faiss.IndexFlatL2] = None
        self.chunks: List[EmbeddedChunk] = []
        self.embedder = CurriculumEmbedder()

    def build_index(self) -> None:
        """
        Loads all EmbeddedChunk objects from the embedder,
        initializes the FAISS index, and adds all embeddings to it.
        """
        logger.info("Building FAISS index for curriculum chunks...")
        
        # Get chunks with their embeddings
        self.chunks = self.embedder.process_and_embed()
        
        if not self.chunks:
            logger.warning("No chunks to index.")
            return

        # Assuming all embeddings have the same dimensionality
        # Extract the dimension from the first embedding
        first_embedding = self.chunks[0].embedding
        dimension = len(first_embedding)
        
        # Initialize the FAISS index
        self.index = faiss.IndexFlatL2(dimension)
        
        # Extract all embeddings and convert them to numpy float32
        embeddings_list = [chunk.embedding for chunk in self.chunks]
        embeddings_array = np.array(embeddings_list, dtype=np.float32)
        
        # Add embeddings to the FAISS index
        self.index.add(embeddings_array)
        logger.info(f"Successfully added {self.total_chunks()} embeddings to FAISS index.")

    def search(self, query_embedding: Any, top_k: int = 5) -> List[EmbeddedChunk]:
        """
        Searches the FAISS index for the most relevant curriculum chunks.

        Args:
            query_embedding (Any): The embedding vector for the search query.
            top_k (int, optional): The maximum number of results to return. Defaults to 5.

        Returns:
            List[EmbeddedChunk]: The top_k most relevant EmbeddedChunk objects, ordered by similarity.
        """
        if self.index is None or self.total_chunks() == 0:
            logger.warning("Search called before index was built or index is empty.")
            return []

        # Convert the query embedding to numpy float32 and reshape for FAISS (needs 2D array)
        query_vector = np.array([query_embedding], dtype=np.float32)
        
        # Make sure we don't request more results than we have in the index
        k = min(top_k, self.total_chunks())
        if k <= 0:
            return []
            
        # Search the index
        # D contains the squared distances, I contains the indices of the nearest neighbors
        distances, indices = self.index.search(query_vector, k)
        
        results: List[EmbeddedChunk] = []
        for idx in indices[0]:
            # Ensure the index is valid (FAISS might return -1 if not enough results)
            if 0 <= idx < len(self.chunks):
                results.append(self.chunks[idx])
                
        return results

    def total_chunks(self) -> int:
        """
        Returns the number of indexed curriculum chunks.

        Returns:
            int: The total count of curriculum chunks stored internally.
        """
        return len(self.chunks)
