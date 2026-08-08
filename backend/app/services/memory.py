from typing import Dict, Any, List, Optional
import time

class SessionState:
    def __init__(
        self,
        session_id: str,
        candidate_data: Dict[str, Any],
        persona_id: str = "senior_engineer",
        max_questions: int = 8,
        frontend_config: Optional[Dict[str, Any]] = None,
    ):
        self.session_id = session_id
        self.candidate = candidate_data
        self.persona_id = persona_id
        self.history: List[Dict[str, Any]] = []
        self.difficulty_levels = ["easy", "medium", "hard", "expert"]
        self.difficulty_index = 1
        self.question_count = 1
        self.max_questions = 16
        self.asked_topics: List[int] = []
        self.asked_questions: List[str] = []
        self.answer_evaluations: List[Dict[str, Any]] = []
        self.current_topic: Optional[Dict[str, Any]] = None
        self.current_question: Optional[str] = None
        self.submitted_answers: Dict[str, str] = {}
        self.questions: List[Dict[str, Any]] = []
        self.status = "active"
        self.feedback: Optional[Dict[str, Any]] = None
        self.frontend_config = frontend_config or {}
        self.created_at = time.time()
        self.updated_at = self.created_at
        self.compressed_summary = ""
        
        self.blueprint = {
            "total_questions": 16,
            "areas": [
                {"area": "Environment & Setup", "target": 2},
                {"area": "Data Foundations", "target": 2},
                {"area": "Embeddings & Vector DB", "target": 2},
                {"area": "LLM Core & Prompting", "target": 2},
                {"area": "Chatbot Integration", "target": 2},
                {"area": "Agentic AI & MCP", "target": 2},
                {"area": "Security & Deployment", "target": 2},
                {"area": "Production Readiness", "target": 2},
            ]
        }
        
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
        direction = (direction or "").lower()
        if direction == "increase" and self.difficulty_index < len(self.difficulty_levels) - 1:
            self.difficulty_index += 1
        elif direction == "decrease" and self.difficulty_index > 0:
            self.difficulty_index -= 1

    def update_knowledge_map(self, topic_module: str, delta: float):
        if topic_module in self.knowledge_map:
            new_val = max(0.0, min(100.0, self.knowledge_map[topic_module] + delta))
            self.knowledge_map[topic_module] = round(new_val, 1)

    def add_turn(self, question: str, answer: str, evaluation: Dict[str, Any], topic: Optional[Dict[str, Any]] = None):
        self.updated_at = time.time()
        self.answer_evaluations.append(evaluation)
        self.history.append({
            "turn": len(self.history) + 1,
            "question": question,
            "answer": answer,
            "evaluation": evaluation,
            "difficulty": self.current_difficulty,
            "topic": topic or self.current_topic or {},
            "timestamp": self.updated_at
        })
        if len(self.history) % 3 == 0:
            recent = self.history[-3:]
            self.compressed_summary = " ".join(
                f"Q{item['turn']} on {item.get('topic', {}).get('title', 'topic')}: "
                f"{item.get('evaluation', {}).get('classification', item.get('evaluation', {}).get('understanding_level', 'partial'))}."
                for item in recent
            )

    def set_current_question(self, question: str, topic: Dict[str, Any], is_followup: bool = False):
        self.current_question = question
        self.current_topic = topic
        self.updated_at = time.time()
        if topic.get("day") and topic["day"] not in self.asked_topics:
            self.asked_topics.append(topic["day"])
        if question not in self.asked_questions:
            self.asked_questions.append(question)
        question_id = f"q{len(self.asked_questions)}"
        self.questions.append({
            "id": question_id,
            "text": question,
            "question": question,
            "topic": topic.get("title"),
            "day": topic.get("day"),
            "difficulty": self.current_difficulty,
            "is_followup": is_followup,
        })
        return self.questions[-1]

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(
        self,
        session_id: str,
        candidate_data: Dict[str, Any],
        persona_id: str = "senior_engineer",
        max_questions: int = 8,
        frontend_config: Optional[Dict[str, Any]] = None,
    ) -> SessionState:
        session = SessionState(session_id, candidate_data, persona_id, max_questions, frontend_config)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def list_sessions(self) -> List[SessionState]:
        return sorted(self._sessions.values(), key=lambda s: s.created_at, reverse=True)

    def delete_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

session_manager = SessionManager()
