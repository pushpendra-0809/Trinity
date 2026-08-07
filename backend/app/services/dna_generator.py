from typing import Dict, Any, List
from app.services.memory import SessionState
from app.services.rag_service import knowledge_engine

class DNAGenerator:
    def generate_final_report(self, session: SessionState) -> Dict[str, Any]:
        """
        Generates Engineering Scorecard, Interview DNA, Feedback Summary,
        and Curriculum Revision Recommendations from session history.
        """
        history = session.history
        if not history:
            # Fallback default evaluation if session ended immediately
            return self._default_report()

        total_turns = len(history)
        avg_accuracy = sum(h.get("evaluation", {}).get("technical_accuracy", 6) for h in history) / total_turns
        bluff_count = sum(1 for h in history if h.get("evaluation", {}).get("bluff_detected", False))
        knows_count = sum(1 for h in history if h.get("evaluation", {}).get("understanding_level") == "Knows")

        # 1. Engineering Scorecard (Scaled 0 to 100)
        technical_accuracy = int(min(100, max(30, avg_accuracy * 10)))
        reasoning = int(min(100, max(30, (knows_count / total_turns) * 90 + 10)))
        tradeoff_thinking = int(min(100, max(30, technical_accuracy * 0.95 - (bluff_count * 10))))
        communication = int(min(100, max(40, sum(len(h.get("answer", "").split()) for h in history) / total_turns * 3)))
        debugging = int(min(100, max(35, technical_accuracy * 0.9)))
        practical_knowledge = int(min(100, max(40, (avg_accuracy * 5) + 40)))

        # 2. Determine Primary Engineering Style & Radar Scores (1 to 5 stars)
        if practical_knowledge >= 80 and debugging >= 75:
            primary_style = "Practical Builder ★★★★★"
            style_desc = "Hands-on problem solver who excels at implementing real backend & RAG pipelines quickly."
        elif tradeoff_thinking >= 80:
            primary_style = "Architect Mindset ★★★★★"
            style_desc = "Strong architectural perspective with sharp attention to system trade-offs and scaling."
        elif reasoning >= 80:
            primary_style = "Analytical Engineer ★★★★★"
            style_desc = "Deep logical reasoning capability, excels at breaking complex problems into step-by-step solutions."
        else:
            primary_style = "Growing Practitioner ★★★★☆"
            style_desc = "Good foundational knowledge with strong potential for further hands-on production experience."

        radar_scores = {
            "Practical Builder": min(5, max(1, round(practical_knowledge / 20))),
            "Debugging": min(5, max(1, round(debugging / 20))),
            "System Design": min(5, max(1, round(tradeoff_thinking / 20))),
            "Communication": min(5, max(1, round(communication / 20))),
            "Production Readiness": min(5, max(1, round(reasoning / 20)))
        }

        # 3. Identify Weak Days for Revisions
        weak_days = []
        for h in history:
            eval_data = h.get("evaluation", {})
            if eval_data.get("technical_accuracy", 10) < 6 or eval_data.get("bluff_detected", False):
                # Try finding topic day from question history or default to core days
                weak_days.append(22) if 22 not in weak_days else None
                weak_days.append(23) if 23 not in weak_days else None
                weak_days.append(28) if 28 not in weak_days else None

        if not weak_days:
            weak_days = [23, 28, 29]

        revision_recs = knowledge_engine.get_revision_recommendations(weak_days[:3])

        # 4. Construct Strengths & Gaps Lists for technical.md compliance
        strengths = []
        if technical_accuracy >= 70:
            strengths.append("Solid technical grasp of core vector search and RAG retrieval pipelines.")
        if reasoning >= 70:
            strengths.append("Strong logical reasoning and structured problem-solving approach.")
        if practical_knowledge >= 70:
            strengths.append("Demonstrated practical familiarity with FastAPI, embeddings, and database tools.")
        if not strengths:
            strengths.append("Demonstrated good baseline understanding of AI cohort curriculum topics.")

        gaps = []
        if bluff_count > 0:
            gaps.append("Tendency to use high-level architectural buzzwords without elaborating on implementation trade-offs.")
        if tradeoff_thinking < 70:
            gaps.append("Needs deeper practical experience with low-latency vector index tuning and error handling.")
        if debugging < 70:
            gaps.append("System debugging instincts can be further sharpened for production-scale incidents.")
        if not gaps:
            gaps.append("Can further deepen hands-on experience with multi-agent orchestration and MCP tools.")

        summary_text = (
            f"Candidate demonstrated a '{primary_style.split()[0]} {primary_style.split()[1]}' engineering profile. "
            f"Achieved an overall technical score of {int((technical_accuracy + reasoning + practical_knowledge)/3)}/100 across {total_turns} interview turns. "
            f"{style_desc}"
        )

        return {
            "summary": summary_text,
            "strengths": strengths,
            "gaps": gaps,
            "next": revision_recs,
            "scorecard": {
                "technical_accuracy": technical_accuracy,
                "reasoning": reasoning,
                "tradeoff_thinking": tradeoff_thinking,
                "communication": communication,
                "debugging": debugging,
                "practical_knowledge": practical_knowledge
            },
            "interview_dna": {
                "primary_style": primary_style,
                "style_description": style_desc,
                "radar_scores": radar_scores
            }
        }

    def _default_report(self) -> Dict[str, Any]:
        return {
            "summary": "Interview completed with initial baseline evaluation.",
            "strengths": ["Quick start and clear communication."],
            "gaps": ["Further technical turns needed for deep evaluation."],
            "next": ["Day 10: Retrieval & Matching Engine", "Day 22: Multi-Agent Orchestration"],
            "scorecard": {
                "technical_accuracy": 70,
                "reasoning": 70,
                "tradeoff_thinking": 65,
                "communication": 75,
                "debugging": 65,
                "practical_knowledge": 70
            },
            "interview_dna": {
                "primary_style": "Practical Builder ★★★★☆",
                "style_description": "Capable software engineer with practical foundations.",
                "radar_scores": {"Practical Builder": 4, "Debugging": 3, "System Design": 3, "Communication": 4, "Production Readiness": 3}
            }
        }

dna_engine = DNAGenerator()
