import json
import logging
from typing import Dict, Any, Optional
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


class AnswerEvaluator:
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


    def evaluate(self, question: str, answer: str, topic_info: Dict[str, Any], history: list) -> Dict[str, Any]:
        """
        Evaluates candidate's answer for technical accuracy, bluffing, and understanding level.
        Returns structured evaluation object.
        """
        if self.use_llm:
            try:
                return self._evaluate_with_llm(question, answer, topic_info, history)
            except Exception as e:
                logger.warning(f"LLM evaluation failed, falling back to heuristic: {e}")
                return self._evaluate_heuristic(question, answer, topic_info)
        else:
            return self._evaluate_heuristic(question, answer, topic_info)

    def _evaluate_with_llm(self, question: str, answer: str, topic_info: Dict[str, Any], history: list) -> Dict[str, Any]:
        prompt = f"""
You are an expert AI Technical Interviewer evaluating a candidate's response.

Topic: Day {topic_info.get('day')} - {topic_info.get('title')}
Target Tools/Concepts: {', '.join(topic_info.get('tools', []))}
Question Asked: {question}
Candidate Answer: {answer}

Conversation Context:
{json.dumps(history[-2:], indent=2) if history else "Beginning of interview"}

Evaluate the answer strictly and return a JSON object matching this schema:
{{
    "understanding_level": "Knows" | "Partially Knows" | "Guessing" | "Bluffing",
    "technical_accuracy": <int 1 to 10>,
    "bluff_detected": <boolean>,
    "bluff_reason": "<string or null>",
    "difficulty_direction": "Increase" | "Decrease" | "Maintain",
    "delta_score": <float -15.0 to +15.0>,
    "feedback_snippet": "<short 1 sentence evaluation>"
}}

Rules:
1. If the candidate drops buzzwords without explaining mechanisms or gives vague hand-waving answers, mark "bluff_detected": true and "understanding_level": "Bluffing".
2. If the answer is confident, technically accurate, and addresses trade-offs, mark "understanding_level": "Knows" and "difficulty_direction": "Increase".
3. Return ONLY valid JSON.
"""
        if GENAI_NEW_AVAILABLE and hasattr(self, 'client'):
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
        else:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
        return result


    def _evaluate_heuristic(self, question: str, answer: str, topic_info: Dict[str, Any]) -> Dict[str, Any]:
        """Smart heuristic fallback when LLM API key is not configured."""
        words = answer.strip().split()
        word_count = len(words)
        lower_ans = answer.lower()
        
        buzzwords = ["ai", "rag", "faiss", "vector", "llm", "mcp", "agent", "docker", "langchain", "embeddings", "scale", "latency", "system"]
        buzzword_count = sum(1 for bw in buzzwords if bw in lower_ans)
        
        # Check for bluffing indicator (many buzzwords but very short text or generic phrases)
        generic_phrases = ["i used", "we implemented", "it was easy", "standard approach", "obviously", "basically"]
        has_generic = any(gp in lower_ans for gp in generic_phrases)
        
        if word_count < 6:
            return {
                "understanding_level": "Guessing",
                "technical_accuracy": 4,
                "bluff_detected": False,
                "bluff_reason": "Answer was too brief to assess depth.",
                "difficulty_direction": "Decrease",
                "delta_score": -5.0,
                "feedback_snippet": "Candidate gave a brief response requiring further probing."
            }
        elif buzzword_count >= 3 and word_count < 15 and has_generic:
            return {
                "understanding_level": "Bluffing",
                "technical_accuracy": 3,
                "bluff_detected": True,
                "bluff_reason": "Candidate dropped technical terms without explaining underlying trade-offs or mechanics.",
                "difficulty_direction": "Decrease",
                "delta_score": -10.0,
                "feedback_snippet": "Buzzword usage detected without mechanistic details."
            }
        elif word_count >= 20 and buzzword_count >= 2:
            return {
                "understanding_level": "Knows",
                "technical_accuracy": 8,
                "bluff_detected": False,
                "bluff_reason": None,
                "difficulty_direction": "Increase",
                "delta_score": 10.0,
                "feedback_snippet": "Clear, detailed response demonstrating solid engineering understanding."
            }
        else:
            return {
                "understanding_level": "Partially Knows",
                "technical_accuracy": 6,
                "bluff_detected": False,
                "bluff_reason": None,
                "difficulty_direction": "Maintain",
                "delta_score": 2.0,
                "feedback_snippet": "Candidate demonstrated general awareness with room for deeper technical details."
            }

evaluator_engine = AnswerEvaluator()
