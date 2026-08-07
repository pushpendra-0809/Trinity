import json
import logging
from typing import Dict, Any, Optional
from app.services.memory import session_manager, SessionState
from app.services.rag_service import knowledge_engine
from app.services.evaluator import evaluator_engine
from app.services.dna_generator import dna_engine
from app.core.personas import get_persona
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try importing Google GenAI SDK if available
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
        if self.api_key:
            if GENAI_NEW_AVAILABLE:
                self.client = genai.Client(api_key=self.api_key)
                self.use_llm = True
            elif GENAI_OLD_AVAILABLE:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.use_llm = True
            else:
                self.use_llm = False
        else:
            self.use_llm = False


    def handle_turn(self, session_id: str, candidate_data: Optional[Dict[str, Any]], message: Optional[str], persona_id: str = "senior_engineer") -> Dict[str, Any]:
        session = session_manager.get_session(session_id)

        # -------------------------------------------------------------
        # TURN 1: INITIALIZATION
        # -------------------------------------------------------------
        if session is None:
            if candidate_data is None:
                # Fallback default candidate if not provided
                candidate_data = {
                    "member": {"id": "CAND-001", "name": "Candidate", "jobRole": "AI Engineer"},
                    "missions": []
                }
            
            session = session_manager.create_session(session_id, candidate_data, persona_id)
            
            # Select 1st topic from candidate's completed curriculum missions
            topic_info = knowledge_engine.select_next_topic(session.candidate, session.asked_topics, session.current_difficulty)
            session.asked_topics.append(topic_info["day"])
            
            # Generate greeting and Question 1
            cand_name = session.candidate.get("member", {}).get("name", "Candidate")
            cand_role = session.candidate.get("member", {}).get("jobRole", "Software Engineer")
            persona = get_persona(session.persona_id)
            
            q1 = self._generate_opening_question(cand_name, cand_role, persona, topic_info)
            greeting = f"Welcome {cand_name}! I'm your interviewer for today. Let's explore your engineering journey and technical depth.\n\n[Question 1/8 · Topic: Day {topic_info['day']} - {topic_info['title']}]\n{q1}"
            
            return {
                "reply": greeting,
                "done": False,
                "feedback": None,
                "current_difficulty": session.current_difficulty,
                "knowledge_map": session.knowledge_map,
                "question_num": 1,
                "total_questions": session.max_questions
            }

        # -------------------------------------------------------------
        # TURN 2..N: CONVERSATION TURN & ANSWER EVALUATION
        # -------------------------------------------------------------
        user_answer = message if message else "I have implemented this in my previous project."
        last_asked_day = session.asked_topics[-1] if session.asked_topics else 10
        topic_info = knowledge_engine.days_map.get(last_asked_day, {
            "day": last_asked_day, "title": "Retrieval & AI Core", "tools": ["FastAPI", "Vector DB"]
        })

        # 1. Evaluate candidate answer
        eval_res = evaluator_engine.evaluate(
            question="Previous question",
            answer=user_answer,
            topic_info=topic_info,
            history=session.history
        )

        # 2. Update session state based on evaluation
        diff_direction = eval_res.get("difficulty_direction", "Maintain")
        session.adjust_difficulty(diff_direction)
        
        # Update Knowledge Map Module
        module_title = topic_info.get("title", "Embeddings & Vector DB")
        delta = eval_res.get("delta_score", 5.0)
        
        # Map day to knowledge category
        category = "Embeddings & Vector DB"
        if last_asked_day <= 3: category = "Environment & Setup"
        elif last_asked_day <= 6: category = "Data Foundations"
        elif last_asked_day <= 10: category = "Embeddings & Vector DB"
        elif last_asked_day <= 15: category = "LLM Core & Prompting"
        elif last_asked_day <= 20: category = "Chatbot Integration"
        elif last_asked_day <= 24: category = "Agentic AI & MCP"
        elif last_asked_day <= 28: category = "Security & Deployment"
        else: category = "Production Readiness"
        
        session.update_knowledge_map(category, delta)
        session.add_turn("Previous Question", user_answer, eval_res)

        # -------------------------------------------------------------
        # TURN N: CHECK FOR INTERVIEW CONCLUSION (8 Questions)
        # -------------------------------------------------------------
        if len(session.history) >= session.max_questions:
            final_report = dna_engine.generate_final_report(session)
            
            return {
                "reply": "Interview completed! Thank you for walking through your engineering experiences. Here is your structured technical feedback and Interview DNA report.",
                "done": True,
                "feedback": {
                    "summary": final_report["summary"],
                    "strengths": final_report["strengths"],
                    "gaps": final_report["gaps"],
                    "next": final_report["next"]
                },
                "current_difficulty": session.current_difficulty,
                "knowledge_map": session.knowledge_map,
                "interview_dna": final_report["interview_dna"],
                "scorecard": final_report["scorecard"],
                "question_num": session.max_questions,
                "total_questions": session.max_questions
            }

        # -------------------------------------------------------------
        # GENERATE NEXT QUESTION (Adaptive Logic)
        # -------------------------------------------------------------
        session.question_count = len(session.history) + 1
        q_num = session.question_count
        persona = get_persona(session.persona_id)

        # Select strategy based on answer evaluation
        is_bluff = eval_res.get("bluff_detected", False)
        understanding = eval_res.get("understanding_level", "Knows")

        if is_bluff:
            # BLUFF DETECTION FOLLOW-UP: Probe the candidate's exact words
            next_q = self._generate_bluff_probe(user_answer, eval_res.get("bluff_reason"), persona)
            prefix = f"[Question {q_num}/8 · Verification Probe · Difficulty: {session.current_difficulty}]\n"
        elif understanding == "Guessing" or understanding == "Weak":
            # FOUNDATIONAL FALLBACK
            next_q = self._generate_foundational_question(topic_info, persona)
            prefix = f"[Question {q_num}/8 · Foundational Follow-up · Difficulty: {session.current_difficulty}]\n"
        else:
            # PROGRESS TO NEXT TOPIC / STEP UP DIFFICULTY
            next_topic = knowledge_engine.select_next_topic(session.candidate, session.asked_topics, session.current_difficulty)
            session.asked_topics.append(next_topic["day"])
            next_q = self._generate_next_topic_question(next_topic, persona, session.current_difficulty)
            prefix = f"[Question {q_num}/8 · Topic: Day {next_topic['day']} - {next_topic['title']} · Difficulty: {session.current_difficulty}]\n"

        full_reply = f"{prefix}{next_q}"

        return {
            "reply": full_reply,
            "done": False,
            "feedback": None,
            "current_difficulty": session.current_difficulty,
            "knowledge_map": session.knowledge_map,
            "question_num": q_num,
            "total_questions": session.max_questions,
            "evaluation_summary": {
                "understanding_level": understanding,
                "technical_accuracy": eval_res.get("technical_accuracy", 7),
                "bluff_detected": is_bluff,
                "bluff_reason": eval_res.get("bluff_reason"),
                "difficulty_direction": diff_direction
            }
        }

    def _generate_opening_question(self, cand_name: str, cand_role: str, persona: Dict[str, str], topic: Dict[str, Any]) -> str:
        if self.use_llm:
            try:
                prompt = f"You are {persona['name']}. Persona instruction: {persona['system_instruction']}. Ask an engaging opening technical question for candidate {cand_name} ({cand_role}) on topic Day {topic['day']}: {topic['title']}."
                return self.model.generate_content(prompt).text.strip()
            except Exception:
                pass
        return f"To start off, in your experience with {topic['title']} (Day {topic['day']}), how did you approach choosing the right tools (such as {', '.join(topic.get('tools', ['Python']))}) and what trade-offs did you consider?"

    def _generate_bluff_probe(self, answer: str, bluff_reason: Optional[str], persona: Dict[str, str]) -> str:
        if self.use_llm:
            try:
                prompt = f"Candidate answered: '{answer}'. Reason suspected bluff: {bluff_reason}. As {persona['name']}, ask a sharp, specific verification question asking them to explain the exact internal mechanics."
                return self.model.generate_content(prompt).text.strip()
            except Exception:
                pass
        return f"Earlier you mentioned using high-level concepts in your answer. Can you walk me through the exact step-by-step internal execution mechanism when that runs in production?"

    def _generate_foundational_question(self, topic: Dict[str, Any], persona: Dict[str, str]) -> str:
        return f"Let's step back to core principles regarding {topic['title']}. What is the fundamental problem this concept solves, and how would you explain it to a junior engineer?"

    def _generate_next_topic_question(self, topic: Dict[str, Any], persona: Dict[str, str], difficulty: str) -> str:
        if self.use_llm:
            try:
                prompt = f"As {persona['name']}, ask a {difficulty} level technical interview question on Day {topic['day']}: {topic['title']}. Objectives: {', '.join(topic.get('objectives', []))}."
                return self.model.generate_content(prompt).text.strip()
            except Exception:
                pass
        return f"Moving to {topic['title']} (Day {topic['day']}): When designing this system at {difficulty} difficulty, how do you handle latency, data consistency, and failure modes?"

orchestrator_engine = InterviewOrchestrator()
