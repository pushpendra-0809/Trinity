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
        self.candidate_id = candidate_data.get("candidate_id") or candidate_data.get("member", {}).get("id") or "cand_new"
        self.candidate_type = candidate_data.get("candidate_type") or "new"
        self.display_name = candidate_data.get("display_name") or candidate_data.get("member", {}).get("name") or "Candidate"
        self.persona_id = persona_id
        self.history: List[Dict[str, Any]] = []
        self.difficulty_levels = ["foundation", "intermediate", "advanced", "system_design"]
        self.difficulty_index = 1  # Start at intermediate
        self.consecutive_strong = 0
        self.consecutive_weak = 0
        self.consecutive_skips = 0
        self.skipped_topics: List[int] = []
        self.recent_scores: List[int] = []
        self.identified_strengths: List[str] = []
        self.identified_gaps: List[str] = []
        
        self.area_difficulties: Dict[str, int] = {
            "Environment & Setup": 0,
            "Data Foundations": 0,
            "Embeddings & Vector DB": 1,
            "LLM Core & Prompting": 1,
            "Chatbot Integration": 1,
            "Agentic AI & MCP": 1,
            "Security & Deployment": 1,
            "Production Readiness": 2,
        }

        self.question_count = 1
        self.max_questions = 16
        self.asked_topics: List[int] = []
        self.asked_questions: List[str] = []
        self.asked_concepts: List[str] = []
        self.candidate_claims: List[str] = []
        self.question_contracts: List[Dict[str, Any]] = []
        self.answer_evaluations: List[Dict[str, Any]] = []
        self.current_topic: Optional[Dict[str, Any]] = None
        self.current_question: Optional[str] = None
        self.submitted_answers: Dict[str, str] = {}
        self.questions: List[Dict[str, Any]] = []
        self.status = "active"
        self.termination_reason: Optional[str] = None
        self.feedback: Optional[Dict[str, Any]] = None
        self.frontend_config = frontend_config or {}
        self.created_at = time.time()
        self.updated_at = self.created_at
        self.current_question_started_at = self.created_at
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

    def adapt_difficulty(self, score: int, area_name: str):
        """TRINITY Adaptive Engine: Updates per-area difficulty and rolling trends."""
        self.recent_scores.append(score)
        if score >= 8:
            self.consecutive_strong += 1
            self.consecutive_weak = 0
        elif score <= 3:
            self.consecutive_weak += 1
            self.consecutive_strong = 0
        else:
            self.consecutive_strong = 0
            self.consecutive_weak = 0

        current_idx = self.area_difficulties.get(area_name, self.difficulty_index)

        # Gradual adaptation logic (Section 6 & 7)
        if score >= 9 or self.consecutive_strong >= 2:
            new_idx = min(len(self.difficulty_levels) - 1, current_idx + 1)
        elif score <= 3 and self.consecutive_weak >= 2:
            new_idx = max(0, current_idx - 1)
        elif score <= 3:
            new_idx = max(0, current_idx - 1)
        else:
            new_idx = current_idx

        self.area_difficulties[area_name] = new_idx
        self.difficulty_index = new_idx

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

    def get_time_spent_seconds(self, end_ts: Optional[float] = None) -> int:
        if not getattr(self, "current_question_started_at", None):
            return 0
        now = end_ts or time.time()
        spent = int(round(now - self.current_question_started_at))
        return max(1, spent)

    def add_turn(self, question: str, answer: str, evaluation: Dict[str, Any], topic: Optional[Dict[str, Any]] = None, action_ts: Optional[float] = None):
        self.updated_at = time.time()
        time_spent = self.get_time_spent_seconds(action_ts or self.updated_at)
        evaluation["time_spent_seconds"] = time_spent
        self.extract_claims(answer)
        self.answer_evaluations.append(evaluation)
        
        score = evaluation.get("score", 0)
        status = "correct" if score >= 7 else "partial" if score >= 4 else "incorrect"
        
        self.history.append({
            "turn": len(self.history) + 1,
            "question": question,
            "answer": answer,
            "status": status,
            "time_spent_seconds": time_spent,
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

    def add_skip_turn(self, question: str, topic: Optional[Dict[str, Any]] = None, action_ts: Optional[float] = None):
        self.updated_at = time.time()
        time_spent = self.get_time_spent_seconds(action_ts or self.updated_at)
        self.consecutive_skips += 1
        day = (topic or self.current_topic or {}).get("day")
        if day and day not in self.skipped_topics:
            self.skipped_topics.append(day)

        evaluation = {
            "technical_accuracy": 0,
            "conceptual_depth": 0,
            "practical_thinking": 0,
            "reasoning": 0,
            "communication": 0,
            "confidence": 0,
            "overall": 0,
            "classification": "skipped",
            "understanding_level": "Skipped",
            "bluff_detected": False,
            "bluff_reason": None,
            "difficulty_direction": "Maintain",
            "delta_score": 0.0,
            "feedback_snippet": "Question skipped by candidate.",
            "score": 0,
            "max_score": 10,
            "performance_level": "skipped",
            "correctness": "skipped",
            "identified_strengths": [],
            "identified_gaps": [],
            "time_spent_seconds": time_spent,
        }

        self.answer_evaluations.append(evaluation)
        self.history.append({
            "turn": len(self.history) + 1,
            "question": question,
            "answer": None,
            "status": "skipped",
            "attempted": False,
            "time_spent_seconds": time_spent,
            "evaluation": evaluation,
            "difficulty": self.current_difficulty,
            "topic": topic or self.current_topic or {},
            "timestamp": self.updated_at
        })

    def extract_claims(self, answer: str):
        known_tech = [
            "FAISS", "ChromaDB", "Pinecone", "Qdrant", "Weaviate", "Milvus",
            "FastAPI", "Docker", "LangChain", "LlamaIndex", "Celery", "Redis",
            "MCP", "vLLM", "Ollama", "Kubernetes", "PyTorch", "TensorFlow",
            "PostgreSQL", "Elasticsearch", "Opensearch", "Kafka", "gRPC"
        ]
        lower_ans = answer.lower()
        for tech in known_tech:
            if tech.lower() in lower_ans and tech not in self.candidate_claims:
                self.candidate_claims.append(tech)

    def set_current_question(self, question: str, topic: Dict[str, Any], is_followup: bool = False, start_ts: Optional[float] = None):
        self.current_question = question
        self.current_topic = topic
        self.updated_at = time.time()
        self.current_question_started_at = start_ts or self.updated_at
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
            "started_at": self.current_question_started_at,
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

    def list_sessions_for_candidate(self, candidate_query: Optional[str]) -> List[SessionState]:
        if not candidate_query:
            return self.list_sessions()

        cq = candidate_query.strip().lower()
        matching = []
        for s in self._sessions.values():
            cid = (s.candidate_id or s.candidate.get("candidate_id") or s.candidate.get("member", {}).get("id") or "").strip().lower()
            cname = (s.display_name or s.candidate.get("display_name") or s.candidate.get("member", {}).get("name") or "").strip().lower()
            if cid == cq or cname == cq or (len(cq) >= 3 and cq in cname):
                matching.append(s)
        return sorted(matching, key=lambda s: s.created_at, reverse=True)

    def delete_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

session_manager = SessionManager()
