from typing import Any, Dict

from app.services.memory import SessionState
from app.services.rag_service import knowledge_engine


class DNAGenerator:
    def generate_final_report(self, session: SessionState) -> Dict[str, Any]:
        history = session.history
        total_questions = 16
        max_marks = 160

        earned_marks = sum(h.get("evaluation", {}).get("score", 0) for h in history)
        percentage = round((earned_marks / max_marks) * 100, 2)
        overall_score = round((earned_marks / max_marks) * 100, 1)

        skipped = sum(1 for h in history if h.get("status") == "skipped")
        answered = sum(
            1
            for h in history
            if h.get("status") not in {"skipped", "not_attempted", "not_reached"}
            and (h.get("answer") is not None or h.get("attempted", True))
        )
        correct = sum(
            1
            for h in history
            if h.get("status") not in {"skipped", "not_attempted", "not_reached"}
            and h.get("evaluation", {}).get("score", 0) > 0
            and not h.get("evaluation", {}).get("bluff_detected", False)
        )
        incorrect = max(0, answered - correct)

        # Definitive TRINITY Invariant: ANSWERED + SKIPPED + NOT_ATTEMPTED = 16
        not_attempted = max(0, total_questions - answered - skipped)

        if overall_score >= 90:
            performance_band = "EXCELLENT"
        elif overall_score >= 80:
            performance_band = "STRONG"
        elif overall_score >= 70:
            performance_band = "GOOD"
        elif overall_score >= 60:
            performance_band = "MODERATE"
        elif overall_score >= 40:
            performance_band = "NEEDS IMPROVEMENT"
        else:
            performance_band = "WEAK"

        total_turns = len(history)
        avg = lambda key, default=6: (
            sum(h.get("evaluation", {}).get(key, default) for h in history) / total_turns
            if total_turns > 0
            else 0
        )
        avg_accuracy = avg("technical_accuracy")
        avg_reasoning = avg("reasoning")
        avg_communication = avg("communication")
        avg_practical = avg("practical_thinking")
        bluff_count = sum(1 for h in history if h.get("evaluation", {}).get("bluff_detected", False))

        technical_accuracy = self._scale(avg_accuracy)
        reasoning = self._scale(avg_reasoning)
        practical_thinking = self._scale(avg_practical)
        communication = self._scale(avg_communication)
        tradeoff_thinking = int(
            min(100, max(0, practical_thinking * 0.9 + reasoning * 0.1 - bluff_count * 7))
        )
        debugging = int(min(100, max(0, technical_accuracy * 0.75 + practical_thinking * 0.25)))

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
            if eval_data.get("score", 10) < 6 or eval_data.get("bluff_detected", False):
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
            strengths.append("Solid technical accuracy on attempted curriculum topics.")
        if reasoning >= 70:
            strengths.append("Structured reasoning when explaining implementation choices.")
        if practical_thinking >= 70:
            strengths.append("Good practical instincts for backend and RAG workflows.")
        if correct >= 4:
            strengths.append("Consistently provided high-quality technical explanations.")
        if not strengths:
            strengths.append("Maintained enough baseline understanding to begin probing technical topics.")

        gaps = []
        if bluff_count:
            gaps.append("Reduce high-level buzzwords and explain the underlying mechanism directly.")
        if not_attempted > 0:
            gaps.append(f"{not_attempted} questions were left unattempted.")
        if tradeoff_thinking < 70:
            gaps.append("Practice production trade-offs around latency, failure modes, and observability.")
        if debugging < 70:
            gaps.append("Strengthen debugging plans for retrieval, model, and API failures.")
        if not gaps:
            gaps.append("Continue deepening multi-agent orchestration and deployment details.")

        status_display = "COMPLETED"
        if getattr(session, "status", None) == "terminated":
            reason = getattr(session, "termination_reason", "VOLUNTARY_EXIT")
            if reason == "VOLUNTARY_EXIT":
                status_display = "Terminated by Candidate (Voluntary Exit)"
            elif reason == "LOGOUT":
                status_display = "Terminated (Candidate Logout)"
            elif reason == "TAB_SWITCH":
                status_display = "Terminated (Tab Switch Violation)"
            elif reason == "LOCKDOWN_VIOLATION":
                status_display = "Terminated (Lockdown Violation)"
            else:
                status_display = "Terminated"

        summary = (
            f"Candidate achieved {earned_marks}/{max_marks} marks ({percentage}%) — {status_display}. "
            f"{style_desc}"
        )

        scorecard = {
            "overall_score": overall_score,
            "earned_marks": earned_marks,
            "max_marks": max_marks,
            "percentage": percentage,
            "performance_band": performance_band,
            "technical_accuracy": technical_accuracy,
            "reasoning": reasoning,
            "communication": communication,
            "practical_thinking": practical_thinking,
            "debugging": debugging,
            "tradeoff_thinking": tradeoff_thinking,
            "status_display": status_display,
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
            area_earned = sum(h.get("evaluation", {}).get("score", 0) for h in matching_turns)
            area_max = 20  # 2 questions per area * 10 marks
            area_pct = round((area_earned / area_max) * 100)
            if not matching_turns:
                area_scores[area_name] = "0% (Not Attempted)"
            else:
                area_scores[area_name] = f"{area_pct}%"

        # Question Time Analysis (Sections 17-22)
        activated_timings = [
            {
                "question_number": idx + 1,
                "time_spent_seconds": h.get("time_spent_seconds", h.get("evaluation", {}).get("time_spent_seconds", 0)),
                "status": h.get("status", "not_attempted"),
                "score": h.get("evaluation", {}).get("score", 0),
                "topic": h.get("topic", {}).get("title") or f"Question {idx + 1}",
            }
            for idx, h in enumerate(history)
            if h.get("time_spent_seconds", 0) > 0 or h.get("status") in {"correct", "incorrect", "skipped", "not_attempted"}
        ]

        valid_times = [t["time_spent_seconds"] for t in activated_timings if t["time_spent_seconds"] > 0]
        avg_time = int(round(sum(valid_times) / len(valid_times))) if valid_times else 0

        fastest_q = min(valid_times) if valid_times else 0
        longest_q = max(valid_times) if valid_times else 0

        fastest_item = next((t for t in activated_timings if t["time_spent_seconds"] == fastest_q), None) if fastest_q > 0 else None
        longest_item = next((t for t in activated_timings if t["time_spent_seconds"] == longest_q), None) if longest_q > 0 else None

        correct_times = [t["time_spent_seconds"] for t in activated_timings if t["status"] in {"correct", "partial"} and t["time_spent_seconds"] > 0]
        incorrect_times = [t["time_spent_seconds"] for t in activated_timings if t["status"] == "incorrect" and t["time_spent_seconds"] > 0]

        correct_avg_time = int(round(sum(correct_times) / len(correct_times))) if correct_times else 0
        incorrect_avg_time = int(round(sum(incorrect_times) / len(incorrect_times))) if incorrect_times else 0

        timing_insights = []
        if valid_times:
            if correct_avg_time > 0 and incorrect_avg_time > 0:
                if correct_avg_time < incorrect_avg_time:
                    timing_insights.append(
                        f"Your correct answers were generally faster ({correct_avg_time}s avg) than your incorrect responses ({incorrect_avg_time}s avg)."
                    )
                else:
                    timing_insights.append(
                        f"You spent significant cognitive time ({correct_avg_time}s avg) carefully verifying your correct responses."
                    )
            if longest_item and longest_item["time_spent_seconds"] >= 45:
                timing_insights.append(
                    f"You spent the most time on Q{longest_item['question_number']} ({longest_item['time_spent_seconds']}s) while working through architectural choices."
                )

        timing_analysis = {
            "avg_time_per_question": avg_time,
            "fastest_question": {
                "question_number": fastest_item["question_number"],
                "time_spent_seconds": fastest_item["time_spent_seconds"],
            } if fastest_item else None,
            "longest_question": {
                "question_number": longest_item["question_number"],
                "time_spent_seconds": longest_item["time_spent_seconds"],
            } if longest_item else None,
            "correct_avg_time": correct_avg_time,
            "incorrect_avg_time": incorrect_avg_time,
            "timing_insights": timing_insights,
            "question_timings": [
                {
                    "question_number": idx + 1,
                    "questionId": f"q{idx + 1}",
                    "status": h.get("status", "not_reached"),
                    "score": h.get("evaluation", {}).get("score", 0),
                    "max_score": 10,
                    "time_spent_seconds": h.get("time_spent_seconds", 0),
                }
                for idx, h in enumerate(history)
            ]
        }

        return {
            "summary": summary,
            "status": getattr(session, "status", "completed"),
            "status_display": status_display,
            "termination_reason": getattr(session, "termination_reason", None),
            "overall_score": overall_score,
            "score": overall_score,
            "percentage": percentage,
            "earned_marks": earned_marks,
            "max_marks": max_marks,
            "performance_band": performance_band,
            "correct": correct,
            "incorrect": incorrect,
            "skipped": skipped,
            "answered": answered,
            "not_attempted": not_attempted,
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
            "timing_analysis": timing_analysis,
            "total_questions": total_questions,
            "attempted_questions": answered,
            "unattempted_questions": not_attempted,
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
        return int(min(100, max(0, score * 10)))

    def _stars(self, score: int) -> int:
        return min(5, max(1, round(score / 20)))

    def _default_report(self, session: SessionState = None) -> Dict[str, Any]:
        return {
            "summary": "Interview completed. 0 / 160 marks (0%) — WEAK performance.",
            "overall_score": 0,
            "score": 0,
            "percentage": 0.0,
            "earned_marks": 0,
            "max_marks": 160,
            "performance_band": "WEAK",
            "correct": 0,
            "incorrect": 0,
            "not_attempted": 16,
            "technical_accuracy": 0,
            "reasoning": 0,
            "communication": 0,
            "practical_thinking": 0,
            "debugging": 0,
            "tradeoff_thinking": 0,
            "strengths": ["No attempted questions recorded."],
            "weaknesses": ["All 16 questions were left unattempted."],
            "gaps": ["All 16 questions were left unattempted."],
            "topics_to_revise": ["Day 1: Setup", "Day 10: Retrieval Engine"],
            "recommended_revision_days": [1, 10],
            "next": ["Day 1: Setup", "Day 10: Retrieval Engine"],
            "knowledge_map": session.knowledge_map if session else {},
            "interview_readiness": 0,
            "scorecard": {
                "overall_score": 0,
                "earned_marks": 0,
                "max_marks": 160,
                "percentage": 0,
                "performance_band": "WEAK",
            },
            "interview_dna": {
                "primary_style": "Unassessed",
                "style_description": "Candidate did not attempt technical questions.",
                "radar_scores": {
                    "Practical Builder": 1,
                    "Debugging": 1,
                    "System Design": 1,
                    "Communication": 1,
                    "Production Readiness": 1,
                },
            },
            "area_scores": {
                "Environment & Setup": "0% (Not Attempted)",
                "Data Foundations": "0% (Not Attempted)",
                "Embeddings & Vector DB": "0% (Not Attempted)",
                "LLM Core & Prompting": "0% (Not Attempted)",
                "Chatbot Integration": "0% (Not Attempted)",
                "Agentic AI & MCP": "0% (Not Attempted)",
                "Security & Deployment": "0% (Not Attempted)",
                "Production Readiness": "0% (Not Attempted)",
            },
            "total_questions": 16,
            "attempted_questions": 0,
            "unattempted_questions": 16,
        }


dna_engine = DNAGenerator()
