from typing import Any, Dict

from app.services.memory import SessionState
from app.services.rag_service import knowledge_engine


class DNAGenerator:
    def generate_final_report(self, session: SessionState) -> Dict[str, Any]:
        history = session.history
        if not history:
            return self._default_report(session)

        total_turns = len(history)
        avg = lambda key, default=6: sum(h.get("evaluation", {}).get(key, default) for h in history) / total_turns
        avg_accuracy = avg("technical_accuracy")
        avg_reasoning = avg("reasoning")
        avg_communication = avg("communication")
        avg_practical = avg("practical_thinking")
        bluff_count = sum(1 for h in history if h.get("evaluation", {}).get("bluff_detected", False))
        strong_count = sum(1 for h in history if h.get("evaluation", {}).get("classification") == "strong")

        technical_accuracy = self._scale(avg_accuracy)
        reasoning = self._scale(avg_reasoning)
        practical_thinking = self._scale(avg_practical)
        communication = self._scale(avg_communication)
        tradeoff_thinking = int(min(100, max(30, practical_thinking * 0.9 + reasoning * 0.1 - bluff_count * 7)))
        debugging = int(min(100, max(35, technical_accuracy * 0.75 + practical_thinking * 0.25)))
        overall_score = int(
            (technical_accuracy + reasoning + communication + practical_thinking + debugging + tradeoff_thinking) / 6
        )

        if practical_thinking >= 80 and debugging >= 75:
            primary_style = "Practical Builder"
            style_desc = "Hands-on problem solver who can translate curriculum concepts into working systems."
        elif tradeoff_thinking >= 80:
            primary_style = "Architect Mindset"
            style_desc = "Strong architectural perspective with attention to system trade-offs and scaling."
        elif reasoning >= 80:
            primary_style = "Analytical Engineer"
            style_desc = "Clear logical reasoning and good ability to break down technical problems."
        else:
            primary_style = "Growing Practitioner"
            style_desc = "Good foundation with room for deeper implementation and production reasoning."

        weak_days = []
        for item in history:
            eval_data = item.get("evaluation", {})
            if eval_data.get("technical_accuracy", 10) < 6 or eval_data.get("bluff_detected", False):
                day = item.get("topic", {}).get("day")
                if day and day not in weak_days:
                    weak_days.append(day)
        if not weak_days:
            weak_days = [day for day, score in self._weakest_days_from_candidate(session).items() if score >= 2][:3]
        if not weak_days:
            weak_days = [23, 28, 29]

        revision_recs = knowledge_engine.get_revision_recommendations(weak_days)
        strengths = []
        if technical_accuracy >= 70:
            strengths.append("Solid technical accuracy on completed curriculum topics.")
        if reasoning >= 70:
            strengths.append("Structured reasoning when explaining implementation choices.")
        if practical_thinking >= 70:
            strengths.append("Good practical instincts for backend and RAG workflows.")
        if strong_count >= 3:
            strengths.append("Consistently handled deeper follow-up questions.")
        if not strengths:
            strengths.append("Maintained enough baseline understanding to continue probing productively.")

        gaps = []
        if bluff_count:
            gaps.append("Reduce high-level buzzwords and explain the underlying mechanism directly.")
        if tradeoff_thinking < 70:
            gaps.append("Practice production trade-offs around latency, failure modes, and observability.")
        if debugging < 70:
            gaps.append("Strengthen debugging plans for retrieval, model, and API failures.")
        if not gaps:
            gaps.append("Continue deepening multi-agent orchestration and deployment details.")

        summary = (
            f"Candidate demonstrated a '{primary_style}' profile with an overall score of {overall_score}/100 "
            f"across {total_turns} adaptive turns. {style_desc}"
        )

        scorecard = {
            "overall_score": overall_score,
            "technical_accuracy": technical_accuracy,
            "reasoning": reasoning,
            "communication": communication,
            "practical_thinking": practical_thinking,
            "debugging": debugging,
            "tradeoff_thinking": tradeoff_thinking,
        }
        interview_dna = {
            "primary_style": primary_style,
            "style_description": style_desc,
            "radar_scores": {
                "Practical Builder": self._stars(practical_thinking),
                "Debugging": self._stars(debugging),
                "System Design": self._stars(tradeoff_thinking),
                "Communication": self._stars(communication),
                "Production Readiness": self._stars(overall_score),
            },
            "coverage_days": sorted(set(session.asked_topics)),
            "bluff_probes": bluff_count,
        }

        area_scores = {}
        for area_name in session.knowledge_map.keys():
            matching_turns = [
                h for h in history
                if self._map_day_to_area(h.get("topic", {}).get("day", 1)) == area_name
            ]
            if matching_turns:
                avg_score = sum(h.get("evaluation", {}).get("overall", 7) for h in matching_turns) / len(matching_turns)
                area_scores[area_name] = f"{int(min(100, max(30, avg_score * 10)))}%"
            else:
                area_scores[area_name] = "Not Assessed"

        return {
            "summary": summary,
            "overall_score": overall_score,
            "technical_accuracy": technical_accuracy,
            "reasoning": reasoning,
            "communication": communication,
            "practical_thinking": practical_thinking,
            "debugging": debugging,
            "tradeoff_thinking": tradeoff_thinking,
            "strengths": strengths,
            "weaknesses": gaps,
            "gaps": gaps,
            "topics_to_revise": revision_recs,
            "recommended_revision_days": weak_days[:5],
            "next": revision_recs,
            "knowledge_map": session.knowledge_map,
            "interview_dna": interview_dna,
            "interview_readiness": overall_score,
            "scorecard": scorecard,
            "area_scores": area_scores,
            "total_questions": session.max_questions,
            "attempted_questions": total_turns,
            "unattempted_questions": max(0, session.max_questions - total_turns),
        }

    def _map_day_to_area(self, day: int) -> str:
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

    def _weakest_days_from_candidate(self, session: SessionState) -> Dict[int, int]:
        scores = {}
        for mission in session.candidate.get("missions", []):
            day = mission.get("day")
            if not day:
                continue
            if mission.get("skipped") or not mission.get("passed", True):
                scores[day] = 3
            elif mission.get("attempts", 0) >= 3:
                scores[day] = 2
        return scores

    def _scale(self, score: float) -> int:
        return int(min(100, max(30, score * 10)))

    def _stars(self, score: int) -> int:
        return min(5, max(1, round(score / 20)))

    def _default_report(self, session: SessionState = None) -> Dict[str, Any]:
        return {
            "summary": "Interview completed with initial baseline evaluation.",
            "overall_score": 70,
            "technical_accuracy": 70,
            "reasoning": 70,
            "communication": 75,
            "practical_thinking": 70,
            "debugging": 65,
            "tradeoff_thinking": 65,
            "strengths": ["Quick start and clear communication."],
            "weaknesses": ["Further technical turns needed for deep evaluation."],
            "gaps": ["Further technical turns needed for deep evaluation."],
            "topics_to_revise": ["Day 10: Retrieval & Matching Engine", "Day 22: Multi-Agent Orchestration"],
            "recommended_revision_days": [10, 22],
            "next": ["Day 10: Retrieval & Matching Engine", "Day 22: Multi-Agent Orchestration"],
            "knowledge_map": session.knowledge_map if session else {},
            "interview_readiness": 70,
            "scorecard": {
                "overall_score": 70,
                "technical_accuracy": 70,
                "reasoning": 70,
                "communication": 75,
                "practical_thinking": 70,
                "debugging": 65,
                "tradeoff_thinking": 65,
            },
            "interview_dna": {
                "primary_style": "Practical Builder",
                "style_description": "Capable software engineer with practical foundations.",
                "radar_scores": {
                    "Practical Builder": 4,
                    "Debugging": 3,
                    "System Design": 3,
                    "Communication": 4,
                    "Production Readiness": 3,
                },
            },
        }


dna_engine = DNAGenerator()
