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
                return self._normalize(self._evaluate_with_llm(question, answer, topic_info, history))
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
Learning Objectives: {', '.join(topic_info.get('objectives', topic_info.get('learning_objectives', [])))}
Question Asked: {question}
Candidate Answer: {answer}

Conversation Context:
{json.dumps(history[-2:], indent=2) if history else "Beginning of interview"}

Evaluate the answer strictly and return a JSON object matching this schema:
{{
    "technical_accuracy": <int 1 to 10>,
    "conceptual_depth": <int 1 to 10>,
    "practical_thinking": <int 1 to 10>,
    "reasoning": <int 1 to 10>,
    "communication": <int 1 to 10>,
    "confidence": <int 1 to 10>,
    "overall": <int 1 to 10>,
    "classification": "strong" | "partial" | "weak" | "uncertain" | "superficial",
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

    def _normalize(self, result: Dict[str, Any]) -> Dict[str, Any]:
        classification = str(result.get("classification") or "").lower()
        understanding = result.get("understanding_level")
        if not classification:
            mapping = {
                "Knows": "strong",
                "Partially Knows": "partial",
                "Guessing": "uncertain",
                "Bluffing": "superficial",
            }
            classification = mapping.get(understanding, "partial")
        result["classification"] = classification
        if not understanding:
            result["understanding_level"] = {
                "strong": "Knows",
                "partial": "Partially Knows",
                "weak": "Guessing",
                "uncertain": "Guessing",
                "superficial": "Bluffing",
            }.get(classification, "Partially Knows")
        for key in [
            "technical_accuracy",
            "conceptual_depth",
            "practical_thinking",
            "reasoning",
            "communication",
            "confidence",
            "overall",
        ]:
            result[key] = max(1, min(10, int(result.get(key, result.get("technical_accuracy", 6)) or 6)))
        result["bluff_detected"] = bool(result.get("bluff_detected") or classification == "superficial")
        result["difficulty_direction"] = result.get("difficulty_direction") or (
            "Increase" if classification == "strong" else "Decrease" if classification in {"weak", "uncertain"} else "Maintain"
        )
        result["delta_score"] = float(result.get("delta_score", (result["overall"] - 6) * 2))
        result["feedback_snippet"] = result.get("feedback_snippet") or "Answer evaluated successfully."
        return result

    def _evaluate_heuristic(self, question: str, answer: str, topic_info: Dict[str, Any]) -> Dict[str, Any]:
        """Smart heuristic fallback when LLM API key is not configured."""
        words = answer.strip().split()
        word_count = len(words)
        lower_ans = answer.lower()
        
        buzzwords = ["ai", "rag", "faiss", "vector", "llm", "mcp", "agent", "docker", "langchain", "embeddings", "scale", "latency", "system"]
        mechanism_words = ["because", "trade", "step", "first", "then", "failure", "debug", "measure", "index", "query", "cache", "test", "deploy"]
        buzzword_count = sum(1 for bw in buzzwords if bw in lower_ans)
        mechanism_count = sum(1 for word in mechanism_words if word in lower_ans)
        
        # Check for bluffing indicator (many buzzwords but very short text or generic phrases)
        generic_phrases = ["i used", "we implemented", "it was easy", "standard approach", "obviously", "basically"]
        has_generic = any(gp in lower_ans for gp in generic_phrases)
        
        if word_count < 6:
            return self._normalize({
                "understanding_level": "Guessing",
                "technical_accuracy": 4,
                "conceptual_depth": 3,
                "practical_thinking": 3,
                "reasoning": 3,
                "communication": 4,
                "confidence": 4,
                "overall": 4,
                "classification": "uncertain",
                "bluff_detected": False,
                "bluff_reason": "Answer was too brief to assess depth.",
                "difficulty_direction": "Decrease",
                "delta_score": -5.0,
                "feedback_snippet": "Candidate gave a brief response requiring further probing."
            })
        elif buzzword_count >= 3 and word_count < 15 and has_generic:
            return self._normalize({
                "understanding_level": "Bluffing",
                "technical_accuracy": 3,
                "conceptual_depth": 3,
                "practical_thinking": 3,
                "reasoning": 3,
                "communication": 5,
                "confidence": 8,
                "overall": 3,
                "classification": "superficial",
                "bluff_detected": True,
                "bluff_reason": "Candidate dropped technical terms without explaining underlying trade-offs or mechanics.",
                "difficulty_direction": "Decrease",
                "delta_score": -10.0,
                "feedback_snippet": "Buzzword usage detected without mechanistic details."
            })
        elif word_count >= 24 and (buzzword_count >= 2 or mechanism_count >= 3):
            return self._normalize({
                "understanding_level": "Knows",
                "technical_accuracy": 8,
                "conceptual_depth": 8 if mechanism_count >= 3 else 7,
                "practical_thinking": 8 if any(w in lower_ans for w in ["debug", "deploy", "latency", "test", "failure"]) else 7,
                "reasoning": 8 if any(w in lower_ans for w in ["because", "trade", "why"]) else 7,
                "communication": 8,
                "confidence": 8,
                "overall": 8,
                "classification": "strong",
                "bluff_detected": False,
                "bluff_reason": None,
                "difficulty_direction": "Increase",
                "delta_score": 10.0,
                "feedback_snippet": "Clear, detailed response demonstrating solid engineering understanding."
            })
        else:
            return self._normalize({
                "understanding_level": "Partially Knows",
                "technical_accuracy": 6,
                "conceptual_depth": 6,
                "practical_thinking": 6 if mechanism_count else 5,
                "reasoning": 6,
                "communication": 6,
                "confidence": 6,
                "overall": 6,
                "classification": "partial",
                "bluff_detected": False,
                "bluff_reason": None,
                "difficulty_direction": "Maintain",
                "delta_score": 2.0,
                "feedback_snippet": "Candidate demonstrated general awareness with room for deeper technical details."
            })

evaluator_engine = AnswerEvaluator()
