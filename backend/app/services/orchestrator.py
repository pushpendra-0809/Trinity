import json
import logging
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.personas import get_persona
from app.services.dna_generator import dna_engine
from app.services.evaluator import evaluator_engine
from app.services.memory import SessionState, session_manager
from app.services.rag_service import knowledge_engine

logger = logging.getLogger(__name__)

try:
    from google import genai
    GENAI_NEW_AVAILABLE = True
except ImportError:
    GENAI_NEW_AVAILABLE = False
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            import google.generativeai as genai
        GENAI_OLD_AVAILABLE = True
    except ImportError:
        GENAI_OLD_AVAILABLE = False


class InterviewOrchestrator:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.use_llm = False
        if self.api_key:
            if GENAI_NEW_AVAILABLE:
                self.client = genai.Client(api_key=self.api_key)
                self.use_llm = True
            elif GENAI_OLD_AVAILABLE:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(settings.MODEL_NAME)
                self.use_llm = True

    def start_session(
        self,
        session_id: str,
        candidate_data: Optional[Dict[str, Any]] = None,
        persona_id: str = "senior_engineer",
        max_questions: int = 16,
        frontend_config: Optional[Dict[str, Any]] = None,
    ) -> SessionState:
        if candidate_data is None:
            candidate_data = knowledge_engine.candidate_from_frontend_config(frontend_config or {})
        session = session_manager.create_session(session_id, candidate_data, persona_id, 16, frontend_config)
        topic = knowledge_engine.select_next_topic(session.candidate, [], session.current_difficulty)
        question = self._generate_question(session, topic, opening=True)
        session.set_current_question(question, topic)
        return session

    def handle_turn(
        self,
        session_id: str,
        candidate_data: Optional[Dict[str, Any]],
        message: Optional[str],
        persona_id: str = "senior_engineer",
    ) -> Dict[str, Any]:
        session = session_manager.get_session(session_id)
        if session is None:
            session = self.start_session(session_id, candidate_data, persona_id)
            cand_name = session.candidate.get("member", {}).get("name", "Candidate")
            topic = session.current_topic or {}
            return {
                "reply": (
                    f"Welcome {cand_name}! I'm your TRINITY interviewer. "
                    f"Let's begin with Day {topic.get('day')}: {topic.get('title')}.\n\n"
                    f"[Question 1/{session.max_questions} | Difficulty: {session.current_difficulty}]\n"
                    f"{session.current_question}"
                ),
                "done": False,
                "feedback": None,
                "current_difficulty": session.current_difficulty,
                "knowledge_map": session.knowledge_map,
                "question_num": 1,
                "total_questions": session.max_questions,
            }

        if session.status == "completed":
            return self._final_response(session)

        user_answer = (message or "").strip()
        if not user_answer:
            return {
                "reply": "Please share your answer so I can continue the interview.",
                "done": False,
                "feedback": None,
                "current_difficulty": session.current_difficulty,
                "knowledge_map": session.knowledge_map,
                "question_num": len(session.history) + 1,
                "total_questions": session.max_questions,
            }

        eval_res = evaluator_engine.evaluate(
            question=session.current_question or "Previous question",
            answer=user_answer,
            topic_info=session.current_topic or {},
            history=session.history,
        )
        topic = session.current_topic or {}
        session.add_turn(session.current_question or "Previous question", user_answer, eval_res, topic)
        session.adjust_difficulty(eval_res.get("difficulty_direction", "Maintain"))
        session.update_knowledge_map(self._knowledge_category(topic.get("day", 10)), eval_res.get("delta_score", 0.0))

        if len(session.history) >= session.max_questions:
            session.status = "completed"
            session.feedback = dna_engine.generate_final_report(session)
            return self._final_response(session)

        next_topic, is_followup = self._choose_next_step(session, user_answer, eval_res)
        question = self._generate_question(
            session,
            next_topic,
            previous_answer=user_answer,
            evaluation=eval_res,
            followup=is_followup,
        )
        session.set_current_question(question, next_topic, is_followup=is_followup)
        q_num = len(session.history) + 1
        label = "Follow-up" if is_followup else f"Day {next_topic.get('day')} - {next_topic.get('title')}"
        return {
            "reply": f"[Question {q_num}/{session.max_questions} | {label} | Difficulty: {session.current_difficulty}]\n{question}",
            "done": False,
            "feedback": None,
            "current_difficulty": session.current_difficulty,
            "knowledge_map": session.knowledge_map,
            "question_num": q_num,
            "total_questions": session.max_questions,
            "evaluation_summary": {
                "understanding_level": eval_res.get("understanding_level"),
                "technical_accuracy": eval_res.get("technical_accuracy", 6),
                "bluff_detected": eval_res.get("bluff_detected", False),
                "bluff_reason": eval_res.get("bluff_reason"),
                "difficulty_direction": eval_res.get("difficulty_direction", "Maintain"),
            },
        }

    def answer_current_question(self, session: SessionState, question_id: str, answer: str) -> SessionState:
        if question_id not in {q["id"] for q in session.questions}:
            raise ValueError("Question does not belong to this interview")
        if session.status == "completed":
            return session
        self.handle_turn(session.session_id, None, answer, session.persona_id)
        session.submitted_answers[question_id] = answer
        return session

    def complete_session(self, session: SessionState) -> Dict[str, Any]:
        if session.status != "completed":
            session.status = "completed"
            session.feedback = dna_engine.generate_final_report(session)
        return session.feedback or {}

    def _choose_next_step(self, session: SessionState, answer: str, evaluation: Dict[str, Any]):
        classification = evaluation.get("classification", "partial")
        should_follow = (
            evaluation.get("bluff_detected")
            or classification in {"weak", "uncertain", "superficial"}
            or (classification == "partial" and len(session.history) < 3)
        )
        if should_follow:
            return session.current_topic or knowledge_engine.select_next_topic(session.candidate, session.asked_topics, session.current_difficulty), True
        topic = knowledge_engine.select_next_topic(
            session.candidate,
            session.asked_topics,
            session.current_difficulty,
            weakness_hint=evaluation.get("feedback_snippet"),
        )
        return topic, False

    def _generate_question(
        self,
        session: SessionState,
        topic: Dict[str, Any],
        opening: bool = False,
        previous_answer: Optional[str] = None,
        evaluation: Optional[Dict[str, Any]] = None,
        followup: bool = False,
    ) -> str:
        persona = get_persona(session.persona_id)
        objectives = topic.get("objectives") or topic.get("learning_objectives") or []
        tools = topic.get("tools", [])
        recent = session.history[-3:]
        if self.use_llm:
            try:
                prompt = f"""
You are TRINITY, a {persona['name']} style technical interviewer.
Ask exactly one question. Do not include answers or multiple questions.
Candidate: {json.dumps(session.candidate.get('member', {}))}
Persona instruction: {persona['system_instruction']}
Curriculum context: Day {topic.get('day')} - {topic.get('title')} / {topic.get('module')}
Objectives: {objectives}
Tools: {tools}
Difficulty: {session.current_difficulty}
Recent memory: {json.dumps(recent, ensure_ascii=True)}
Previous answer: {previous_answer or ''}
Evaluation: {json.dumps(evaluation or {}, ensure_ascii=True)}
Need follow-up: {followup}
"""
                if GENAI_NEW_AVAILABLE and hasattr(self, "client"):
                    response = self.client.models.generate_content(model=settings.MODEL_NAME, contents=prompt)
                    text = response.text
                else:
                    text = self.model.generate_content(prompt).text
                cleaned = self._one_question(text)
                if cleaned:
                    return cleaned
            except Exception as exc:
                logger.warning("LLM question generation failed: %s", exc)

        title = topic.get("title", "this curriculum topic")
        tool_text = ", ".join(tools[:3]) if tools else "the tools from this curriculum day"
        if opening:
            return (
                f"You completed {title}. Walk me through the core problem it solves, "
                f"how you used {tool_text}, and one trade-off you had to manage."
            )
        if followup and evaluation and evaluation.get("bluff_detected"):
            return (
                f"Earlier you used some high-level terms around {title}. Can you explain the exact mechanism step by step, "
                "from input to output, and where it can fail?"
            )
        if followup:
            return (
                f"Let's stay on {title}. What would you change in your approach if the first implementation gave incorrect "
                "or inconsistent results in production?"
            )
        if session.current_difficulty in {"hard", "expert"}:
            return (
                f"For {title}, design a production-ready approach using {tool_text}. What are the main scaling, latency, "
                "and observability trade-offs?"
            )
        return (
            f"Moving to {title}: how would you implement this in a real backend, and how would you verify that it works?"
        )

    def _one_question(self, text: str) -> str:
        text = (text or "").strip()
        if not text:
            return ""
        lines = [line.strip("- \n") for line in text.splitlines() if line.strip()]
        text = " ".join(lines)
        if "?" in text:
            text = text[: text.index("?") + 1]
        return text[:700]

    def _knowledge_category(self, day: int) -> str:
        if day <= 3:
            return "Environment & Setup"
        if day <= 6:
            return "Data Foundations"
        if day <= 10:
            return "Embeddings & Vector DB"
        if day <= 15:
            return "LLM Core & Prompting"
        if day <= 20:
            return "Chatbot Integration"
        if day <= 24:
            return "Agentic AI & MCP"
        if day <= 28:
            return "Security & Deployment"
        return "Production Readiness"

    def _final_response(self, session: SessionState) -> Dict[str, Any]:
        report = session.feedback or dna_engine.generate_final_report(session)
        session.feedback = report
        return {
            "reply": "Interview completed. Here is your structured TRINITY feedback.",
            "done": True,
            "feedback": {
                "summary": report["summary"],
                "strengths": report["strengths"],
                "gaps": report["gaps"],
                "next": report["next"],
            },
            "current_difficulty": session.current_difficulty,
            "knowledge_map": session.knowledge_map,
            "interview_dna": report.get("interview_dna", {}),
            "scorecard": report.get("scorecard", {}),
            "question_num": session.max_questions,
            "total_questions": session.max_questions,
        }


orchestrator_engine = InterviewOrchestrator()
