import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

from .loader import load_candidates
from .retriever import CurriculumRetriever
from .embedder import EmbeddedChunk

logger = logging.getLogger(__name__)

@dataclass
class RankedTopic:
    """Represents a selected curriculum topic and its assigned priority score."""
    topic_chunk: EmbeddedChunk
    priority_score: int

class TopicSelector:
    """
    Curriculum-aware topic selection engine.
    Analyzes candidate performance and retrieves targeted curriculum areas for improvement.
    """
    def __init__(self):
        logger.info("Initializing TopicSelector...")
        self.retriever = CurriculumRetriever()
        
    def _calculate_priority(self, mission: Optional[Dict[str, Any]]) -> int:
        """
        Assigns a priority score to a curriculum day based on candidate data.
        
        Priority levels:
        - Highest (3): skipped topics, failed topics, many attempts (>= 3)
        - Medium (2): completed but weak learning signals (e.g., 2 attempts)
        - Lowest (1): successfully completed topics (1 attempt)
        
        Args:
            mission: The candidate's mission record for a specific day, or None if unattempted.
            
        Returns:
            int: The calculated priority score (1 to 3).
        """
        if not mission:
            # If the candidate has no data for this day, it represents a skipped/unseen topic
            return 3
            
        skipped = mission.get("skipped", False)
        # Default to True if 'passed' key is missing, assuming completion implies passing unless stated otherwise
        passed = mission.get("passed", True) 
        attempts = mission.get("attempts", 0)
        
        if skipped or not passed or attempts >= 3:
            return 3
        elif passed and attempts == 2:
            return 2
        else:
            return 1

    def select_topics(self, candidate_id: str, top_k: int = 5) -> List[RankedTopic]:
        """
        Analyzes a candidate's history, scores every curriculum day, and retrieves
        the most relevant topics using the CurriculumRetriever.
        
        Args:
            candidate_id (str): The unique identifier of the candidate.
            top_k (int, optional): Maximum number of topics to retrieve. Defaults to 5.
            
        Returns:
            List[RankedTopic]: A ranked list of curriculum topics based on semantic relevance
                               and candidate priority score.
        """
        logger.info(f"Selecting topics for candidate: {candidate_id}")
        
        # 1. Load candidate data
        candidates_data = load_candidates()
        candidates_list = candidates_data.get("candidates", [])
        
        candidate = next((c for c in candidates_list if c.get("member", {}).get("id") == candidate_id), None)
        
        if not candidate:
            logger.warning(f"Candidate {candidate_id} not found. Returning empty list.")
            return []
            
        # 2. Analyze missions and learning signals
        missions = candidate.get("missions", [])
        
        # Map each day to its corresponding mission for quick O(1) lookup
        mission_by_day = {m.get("day"): m for m in missions if m.get("day") is not None}
        
        day_priorities: Dict[int, int] = {}
        highest_priority_titles: List[str] = []
        
        # 3. Assign a priority score to every curriculum day
        # We iterate over all available chunks in the vector store to ensure total coverage
        all_chunks = self.retriever.vector_store.chunks
        for emb_chunk in all_chunks:
            day = emb_chunk.chunk.day
            mission = mission_by_day.get(day)
            
            score = self._calculate_priority(mission)
            day_priorities[day] = score
            
            if score == 3:
                highest_priority_titles.append(emb_chunk.chunk.title)
                
        # We build a search query based on the candidate's core weaknesses.
        # Joining the top 10 weak topics forms a robust semantic vector.
        if highest_priority_titles:
            query = " ".join(highest_priority_titles[:10])
        else:
            # Fallback if the candidate is completely perfect
            query = "advanced AI engineering concepts"
            
        logger.info(f"Querying CurriculumRetriever for relevant chunks using candidate weak spots...")
        
        # 4. Use CurriculumRetriever to retrieve relevant curriculum chunks
        retrieved_chunks = self.retriever.retrieve(query, top_k=top_k)
        
        # 5. Return a ranked list of curriculum topics
        ranked_topics = []
        for emb_chunk in retrieved_chunks:
            day = emb_chunk.chunk.day
            score = day_priorities.get(day, 1)
            ranked_topics.append(RankedTopic(topic_chunk=emb_chunk, priority_score=score))
            
        # Sort primarily by priority score (descending) to ensure the candidate 
        # is recommended topics they struggle with the most, while still maintaining 
        # the semantic relevance constraints from the retriever.
        ranked_topics.sort(key=lambda x: x.priority_score, reverse=True)
        
        logger.info(f"Successfully selected and ranked {len(ranked_topics)} topics.")
        return ranked_topics
