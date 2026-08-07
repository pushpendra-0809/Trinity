from typing import Dict, Any, List, Optional
import time

class SessionState:
    def __init__(self, session_id: str, candidate_data: Dict[str, Any], persona_id: str = "senior_engineer"):
        self.session_id = session_id
        self.candidate = candidate_data
        self.persona_id = persona_id
        self.history: List[Dict[str, Any]] = []
        self.difficulty_levels = ["Easy", "Medium", "Hard", "System Design"]
        self.difficulty_index = 1  # Default to "Medium"
        self.question_count = 1
        self.max_questions = 8
        self.asked_topics: List[int] = []  # List of curriculum days asked
        self.created_at = time.time()
        
        # Initial Knowledge Map (Confidence Graph)
        self.knowledge_map: Dict[str, float] = {
            "Environment & Setup": 70.0,
            "Data Foundations": 70.0,
            "Embeddings & Vector DB": 65.0,
            "LLM Core & Prompting": 65.0,
            "Chatbot Integration": 60.0,
            "Agentic AI & MCP": 50.0,
            "Security & Deployment": 50.0,
            "Production Readiness": 45.0
        }

    @property
    def current_difficulty(self) -> str:
        return self.difficulty_levels[self.difficulty_index]

    def adjust_difficulty(self, direction: str):
        if direction == "Increase" and self.difficulty_index < len(self.difficulty_levels) - 1:
            self.difficulty_index += 1
        elif direction == "Decrease" and self.difficulty_index > 0:
            self.difficulty_index -= 1

    def update_knowledge_map(self, topic_module: str, delta: float):
        if topic_module in self.knowledge_map:
            new_val = max(0.0, min(100.0, self.knowledge_map[topic_module] + delta))
            self.knowledge_map[topic_module] = round(new_val, 1)

    def add_turn(self, question: str, answer: str, evaluation: Dict[str, Any]):
        self.history.append({
            "turn": len(self.history) + 1,
            "question": question,
            "answer": answer,
            "evaluation": evaluation,
            "difficulty": self.current_difficulty,
            "timestamp": time.time()
        })

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(self, session_id: str, candidate_data: Dict[str, Any], persona_id: str = "senior_engineer") -> SessionState:
        session = SessionState(session_id, candidate_data, persona_id)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

session_manager = SessionManager()
