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

        contract = self._create_question_contract(1, topic, session.current_difficulty, False)
        session.question_contracts.append(contract)
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
            return {
                "reply": session.current_question,
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

        # 1. Evaluate Candidate Answer (API-based evaluation + Prompt Injection Defense)
        eval_res = evaluator_engine.evaluate(
            question=session.current_question or "Previous question",
            answer=user_answer,
            topic_info=session.current_topic or {},
            history=session.history,
        )

        topic = session.current_topic or {}
        area_name = self._knowledge_category(topic.get("day", 10))

        # 2. Update Performance State & Adaptive Engine (Section 5 & 6)
        session.add_turn(session.current_question or "Previous question", user_answer, eval_res, topic)
        session.adapt_difficulty(eval_res.get("score", 6), area_name)
        session.update_knowledge_map(area_name, eval_res.get("delta_score", 0.0))

        if eval_res.get("identified_strengths"):
            session.identified_strengths.extend(eval_res["identified_strengths"])
        if eval_res.get("identified_gaps"):
            session.identified_gaps.extend(eval_res["identified_gaps"])

        # 3. Check 16-Question Budget Constraint (Section 16)
        if len(session.history) >= session.max_questions:
            session.status = "completed"
            session.feedback = dna_engine.generate_final_report(session)
            return self._final_response(session)

        # 4. Next Question Decision Strategy (Section 10 & 20)
        next_topic, is_followup, strategy = self._choose_next_step(session, user_answer, eval_res)
        question = self._generate_question(
            session,
            next_topic,
            previous_answer=user_answer,
            evaluation=eval_res,
            followup=is_followup,
            strategy=strategy,
        )
        session.set_current_question(question, next_topic, is_followup=is_followup)
        q_num = len(session.history) + 1

        contract = self._create_question_contract(q_num, next_topic, session.current_difficulty, is_followup, eval_res)
        session.question_contracts.append(contract)

        return {
            "reply": question,
            "done": False,
            "feedback": None,
            "current_difficulty": session.current_difficulty,
            "knowledge_map": session.knowledge_map,
            "question_num": q_num,
            "total_questions": session.max_questions,
            "contract": contract,
            "evaluation_summary": {
                "understanding_level": eval_res.get("understanding_level"),
                "technical_accuracy": eval_res.get("technical_accuracy", 6),
                "score": eval_res.get("score", 6),
                "bluff_detected": eval_res.get("bluff_detected", False),
                "bluff_reason": eval_res.get("bluff_reason"),
                "difficulty_direction": eval_res.get("difficulty_direction", "Maintain"),
                "next_strategy": strategy,
            },
        }

    def handle_skip(self, session_id: str) -> Dict[str, Any]:
        session = session_manager.get_session(session_id)
        if session is None or session.status == "completed":
            return self._final_response(session) if session else {}

        topic = session.current_topic or {}
        session.add_skip_turn(session.current_question or "Previous question", topic)

        if len(session.history) >= session.max_questions:
            session.status = "completed"
            session.feedback = dna_engine.generate_final_report(session)
            return self._final_response(session)

        # Retain current difficulty on skip (Section 8 & 17 of TRINITY Skip Spec)
        next_topic = knowledge_engine.select_next_topic(
            session.candidate,
            session.asked_topics,
            session.current_difficulty,
        )

        question = self._generate_question(
            session,
            next_topic,
            opening=False,
            followup=False,
            strategy="retain_difficulty_and_assess_next_area",
        )

        session.set_current_question(question, next_topic, is_followup=False)
        q_num = len(session.history) + 1

        contract = self._create_question_contract(q_num, next_topic, session.current_difficulty, False)
        session.question_contracts.append(contract)

        return {
            "reply": question,
            "done": False,
            "feedback": None,
            "current_difficulty": session.current_difficulty,
            "knowledge_map": session.knowledge_map,
            "question_num": q_num,
            "total_questions": session.max_questions,
            "contract": contract,
            "evaluation_summary": {
                "understanding_level": "Skipped",
                "technical_accuracy": 0,
                "score": 0,
                "bluff_detected": False,
                "bluff_reason": None,
                "difficulty_direction": "Maintain",
                "next_strategy": "retain_difficulty_and_assess_next_area",
            },
        }

    def handle_termination(self, session_id: str, reason: str = "VOLUNTARY_EXIT") -> Dict[str, Any]:
        session = session_manager.get_session(session_id)
        if session is None:
            raise ValueError("Session not found")

        if session.status in {"completed", "terminated"}:
            return self._final_response(session)

        session.status = "terminated"
        session.termination_reason = reason

        remaining_count = max(0, session.max_questions - len(session.history))
        current_turn = len(session.history)

        for idx in range(remaining_count):
            turn_num = current_turn + idx + 1
            # idx == 0 was the active question visible to candidate when terminated
            is_active_question = (idx == 0)
            status_val = "not_attempted" if is_active_question else "not_reached"
            time_spent = session.get_time_spent_seconds() if is_active_question else 0

            evaluation = {
                "understanding_level": "Unattempted" if is_active_question else "Not Reached",
                "technical_accuracy": 0,
                "score": 0,
                "max_score": 10,
                "performance_level": status_val,
                "correctness": status_val,
                "identified_strengths": [],
                "identified_gaps": [],
                "time_spent_seconds": time_spent,
            }
            session.answer_evaluations.append(evaluation)
            session.history.append({
                "turn": turn_num,
                "question": session.current_question if (is_active_question and session.current_question) else f"Question {turn_num} (Not Reached)",
                "answer": None,
                "status": status_val,
                "attempted": False,
                "time_spent_seconds": time_spent,
                "evaluation": evaluation,
                "difficulty": session.current_difficulty,
                "topic": session.current_topic if is_active_question else {},
                "timestamp": session.updated_at
            })

        session.feedback = dna_engine.generate_final_report(session)
        return self._final_response(session)

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
        score = evaluation.get("score", 6)
        bluff = evaluation.get("bluff_detected", False)
        classification = evaluation.get("classification", "partial")

        # Track recent followups (max 2 consecutive followups on same topic)
        recent_followups = sum(1 for q in session.questions[-2:] if q.get("is_followup"))

        if bluff or score <= 3:
            strategy = "simplify_concept_or_probe_recovery"
            should_follow = recent_followups < 2
        elif score in {4, 5}:
            strategy = "probe_identified_gap"
            should_follow = recent_followups < 2
        elif score in {6, 7}:
            strategy = "confirm_practical_understanding"
            should_follow = False
        else:  # 8, 9, 10
            strategy = "increase_complexity_or_tradeoff"
            should_follow = False

        if should_follow:
            return session.current_topic or knowledge_engine.select_next_topic(session.candidate, session.asked_topics, session.current_difficulty), True, strategy

        topic = knowledge_engine.select_next_topic(
            session.candidate,
            session.asked_topics,
            session.current_difficulty,
            weakness_hint=evaluation.get("feedback_snippet"),
        )
        return topic, False, strategy

    def _generate_question(
        self,
        session: SessionState,
        topic: Dict[str, Any],
        opening: bool = False,
        previous_answer: Optional[str] = None,
        evaluation: Optional[Dict[str, Any]] = None,
        followup: bool = False,
        strategy: str = "confirm_understanding",
    ) -> str:
        persona = get_persona(session.persona_id)
        objectives = topic.get("objectives") or topic.get("learning_objectives") or []
        tools = topic.get("tools", [])
        recent = session.history[-3:]
        claims_text = ", ".join(session.candidate_claims[-5:]) if session.candidate_claims else "None recorded yet"

        if self.use_llm:
            try:
                prompt = f"""
You are TRINITY, a senior AI engineering interviewer with persona: {persona['name']}.
Persona instructions: {persona['system_instruction']}

ADAPTIVE STRATEGY FOR THIS TURN: [{strategy.upper()}]
Current Area Difficulty Level: [{session.current_difficulty.upper()}]

RULES FOR GENERATING THE QUESTION:
1. Output ONLY the conversational question text spoken directly to the candidate.
2. DO NOT prepend labels like "Question 1:", "Follow-up:", or "[Question X/16]".
3. Conversational Transitions: Start naturally acknowledging the candidate's previous response or introducing the topic (e.g., "That makes sense.", "Good — let's push that idea a little further.", "You mentioned earlier that you used FAISS in your project...", "That's a reasonable starting point.").
4. Context & Claims: Candidate previously mentioned tech stack/claims: [{claims_text}]. Reference these claims naturally where applicable.
5. Adaptive Strategy Execution:
   - If strategy is 'simplify_concept_or_probe_recovery': Ask a simpler fundamental question or clarify mechanics.
   - If strategy is 'probe_identified_gap': Probe the specific missing concept identified in previous evaluation.
   - If strategy is 'increase_complexity_or_tradeoff': Challenge with advanced system design, latency, failure recovery, or production trade-offs.

Session Context:
Candidate: {json.dumps(session.candidate.get('member', {}))}
Current Topic: Day {topic.get('day')} - {topic.get('title')} ({topic.get('module')})
Target Objectives: {objectives}
Tools: {tools}
Previous Candidate Answer: {previous_answer or 'Opening turn'}
Evaluation of Last Answer: {json.dumps(evaluation or {}, ensure_ascii=True)}
Is Follow-Up Probing Turn: {followup}
Recent Conversation Summary: {json.dumps(recent, ensure_ascii=True)}
"""
                if GENAI_NEW_AVAILABLE and hasattr(self, "client"):
                    response = self.client.models.generate_content(model=settings.MODEL_NAME, contents=prompt)
                    text = response.text
                else:
                    text = self.model.generate_content(prompt).text
                cleaned = self._clean_conversational_question(text)
                if cleaned:
                    return cleaned
            except Exception as exc:
                logger.warning("LLM question generation failed: %s", exc)

        # Fallback Conversational Question Generator
        title = topic.get("title", "this curriculum topic")
        tool_text = ", ".join(tools[:3]) if tools else "the target tools"
        last_claim = session.candidate_claims[-1] if session.candidate_claims else (tools[0] if tools else "Python")

        if opening:
            return (
                f"Welcome! Let's begin by looking at {title}. Walk me through the core problem this solves in production, "
                f"how you approached using {tool_text}, and one key trade-off you had to balance."
            )
        if followup and evaluation and (evaluation.get("bluff_detected") or evaluation.get("score", 6) <= 3):
            return (
                f"Before we dive into advanced options for {title}, let's step back: can you explain step-by-step "
                f"what happens between the input query and the retrieved documents when using {last_claim}?"
            )
        if followup:
            return (
                f"That's a good start on {title}. You mentioned using {last_claim}. "
                f"If your retrieval latency spiked significantly under high query volume, what exact factors would you investigate first?"
            )
        if session.current_difficulty in {"advanced", "system_design", "hard", "expert"}:
            return (
                f"Good progress. Moving to {title}: suppose you are scaling a production backend using {tool_text}. "
                f"How would you handle data consistency, failure recovery, and latency trade-offs under heavy load?"
            )
        return (
            f"That makes sense. Now let's explore {title}: how would you implement this in a real-world backend, "
            f"and what automated testing strategy would you use to verify it?"
        )

    def _create_question_contract(
        self,
        q_num: int,
        topic: Dict[str, Any],
        difficulty: str,
        is_followup: bool,
        evaluation: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        classification = (evaluation.get("classification") if evaluation else "opening") or "general"
        q_type = "scenario"
        if is_followup:
            q_type = "tradeoff" if classification in {"strong", "excellent"} else "debugging" if classification in {"weak", "uncertain", "superficial"} else "conceptual"
        elif difficulty in {"advanced", "system_design", "hard", "expert"}:
            q_type = "system_design"
        elif difficulty == "intermediate":
            q_type = "practical"

        return {
            "question_number": q_num,
            "area": topic.get("module_title") or topic.get("module") or "AI Engineering",
            "topic": topic.get("title", "Core Concept"),
            "difficulty": difficulty,
            "type": q_type,
            "is_follow_up": is_followup,
            "parent_question": q_num - 1 if is_followup and q_num > 1 else None,
            "reason": f"Assess {q_type} knowledge in {topic.get('title')}",
        }

    def _clean_conversational_question(self, text: str) -> str:
        text = (text or "").strip()
        if not text:
            return ""
        lines = [line.strip("- \n") for line in text.splitlines() if line.strip()]
        text = " ".join(lines)
        if "?" in text:
            text = text[: text.index("?") + 1]
        return text[:750]

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
            "reply": "Interview completed. Thank you for walking through your engineering experiences. Here is your structured TRINITY feedback and technical scorecard.",
            "done": True,
            "status": session.status,
            "termination_reason": session.termination_reason,
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
