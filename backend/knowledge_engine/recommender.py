import logging
from dataclasses import dataclass
from typing import List

from .loader import load_candidates
from .topic_selector import TopicSelector

logger = logging.getLogger(__name__)

@dataclass
class CandidateFeedback:
    """Structured interview feedback generated deterministically from candidate data."""
    knowledge_score: int
    confidence_level: str
    strengths: List[str]
    weaknesses: List[str]
    revision_priority: List[str]
    recommended_next_topics: List[str]
    interview_readiness: str

class RecommendationEngine:
    """
    Engine for generating structured feedback and recommendations 
    without the use of AI/LLM models, relying purely on candidate data.
    """
    def __init__(self):
        logger.info("Initializing RecommendationEngine...")
        self.topic_selector = TopicSelector()

    def generate_feedback(self, candidate_id: str) -> CandidateFeedback:
        """
        Calculates knowledge scores, categorizes candidate readiness, 
        and extracts strengths/weaknesses from their learning signals.

        Args:
            candidate_id (str): The candidate's unique identifier.

        Returns:
            CandidateFeedback: The complete structured feedback object.
        """
        logger.info(f"Generating feedback for candidate: {candidate_id}")
        
        # 1. Load data
        candidates_data = load_candidates()
        candidates_list = candidates_data.get("candidates", [])
        
        candidate = next((c for c in candidates_list if c.get("member", {}).get("id") == candidate_id), None)
        
        if not candidate:
            logger.warning(f"Candidate {candidate_id} not found. Returning baseline feedback.")
            return CandidateFeedback(0, "Low", [], [], [], [], "Beginner")
            
        missions = candidate.get("missions", [])
        signals = candidate.get("signals", {})
        
        strengths = []
        weaknesses = []
        revision_priority = []
        
        # 2. Analyze missions directly to populate categories deterministically
        for mission in missions:
            title = mission.get("title", "Unknown Topic")
            skipped = mission.get("skipped", False)
            passed = mission.get("passed", True)
            attempts = mission.get("attempts", 0)
            
            if skipped or not passed or attempts >= 3:
                weaknesses.append(title)
            elif passed and attempts == 2:
                revision_priority.append(title)
            elif passed and attempts == 1:
                strengths.append(title)
                
        # 3. Calculate Knowledge Score (0-100)
        # Using a weighted formula: 70% Completion + 30% Accuracy
        # The curriculum contains 31 total missions based on the dataset standard
        TOTAL_CURRICULUM_MISSIONS = 31
        
        completed = signals.get("missionsCompleted", sum(1 for m in missions if m.get("passed", False) and not m.get("skipped", False)))
        first_try = signals.get("missionsFirstTry", len(strengths))
        
        completion_ratio = min(completed / TOTAL_CURRICULUM_MISSIONS, 1.0)
        completion_points = completion_ratio * 70.0
        
        accuracy_ratio = (first_try / completed) if completed > 0 else 0.0
        accuracy_points = accuracy_ratio * 30.0
        
        knowledge_score = int(completion_points + accuracy_points)
        
        # 4. Determine Confidence Level
        if knowledge_score >= 85:
            confidence_level = "High"
        elif knowledge_score >= 65:
            confidence_level = "Medium"
        else:
            confidence_level = "Low"
            
        # 5. Determine Interview Readiness
        if knowledge_score >= 80:
            interview_readiness = "Advanced"
        elif knowledge_score >= 50:
            interview_readiness = "Intermediate"
        else:
            interview_readiness = "Beginner"
            
        # 6. Retrieve Recommended Next Topics via the Topic Selector
        # Topic selector already considers candidate's weak areas and maps them to semantic chunks
        ranked_topics = self.topic_selector.select_topics(candidate_id, top_k=3)
        recommended_next_topics = [rt.topic_chunk.chunk.title for rt in ranked_topics]
        
        feedback = CandidateFeedback(
            knowledge_score=knowledge_score,
            confidence_level=confidence_level,
            strengths=strengths,
            weaknesses=weaknesses,
            revision_priority=revision_priority,
            recommended_next_topics=recommended_next_topics,
            interview_readiness=interview_readiness
        )
        
        logger.info(f"Feedback successfully generated (Score: {knowledge_score}, Readiness: {interview_readiness})")
        return feedback
