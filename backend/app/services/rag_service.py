import json
import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings


TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


def _tokens(text: str) -> List[str]:
    return [t.lower() for t in TOKEN_RE.findall(text or "") if len(t) > 2]


class KnowledgeEngine:
    """Curriculum-grounded retrieval with deterministic local fallback."""

    def __init__(self):
        self.candidates_data: List[Dict[str, Any]] = []
        self.curriculum_data: Dict[str, Any] = {}
        self.days_map: Dict[int, Dict[str, Any]] = {}
        self.modules_map: Dict[int, Dict[str, Any]] = {}
        self.chunks: List[Dict[str, Any]] = []
        self._vectors: List[Counter] = []
        self._load_data()
        self._build_chunks()

    def _safe_load_json(self, path, default):
        if not path.exists():
            return default
        try:
            with open(path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (OSError, json.JSONDecodeError):
            return default

    def _load_data(self):
        candidates = self._safe_load_json(settings.CANDIDATES_FILE, {"candidates": []})
        curriculum = self._safe_load_json(settings.CURRICULUM_FILE, {"modules": [], "days": []})
        self.candidates_data = candidates.get("candidates", [])
        self.curriculum_data = curriculum

        for day in curriculum.get("days", []):
            if "day" in day:
                self.days_map[int(day["day"])] = day
        for module in curriculum.get("modules", []):
            if "n" in module:
                self.modules_map[int(module["n"])] = module

    def _module_for_day(self, day_num: int) -> str:
        for module in self.curriculum_data.get("modules", []):
            day_range = module.get("days", [])
            if len(day_range) == 2 and day_range[0] <= day_num <= day_range[1]:
                return module.get("title", "AI Engineering Core")
            if len(day_range) == 1 and day_range[0] == day_num:
                return module.get("title", "AI Engineering Core")
        return "AI Engineering Core"

    def _build_chunks(self):
        self.chunks = []
        for day in self.curriculum_data.get("days", []):
            day_num = int(day.get("day", 0))
            objectives = day.get("objectives", [])
            tools = day.get("tools", [])
            module = self._module_for_day(day_num)
            content = "\n".join(
                [
                    f"Day {day_num}: {day.get('title', '')}",
                    f"Module: {module}",
                    f"Type: {day.get('type', '')}",
                    "Learning objectives: " + "; ".join(objectives),
                    "Tools: " + ", ".join(tools),
                ]
            )
            chunk = {
                "day": day_num,
                "title": day.get("title", f"Day {day_num}"),
                "topic": day.get("title", f"Day {day_num}"),
                "module": module,
                "module_title": module,
                "type": day.get("type", ""),
                "objectives": objectives,
                "learning_objectives": objectives,
                "tools": tools,
                "content": content,
            }
            self.chunks.append(chunk)
        self._vectors = [Counter(_tokens(chunk["content"])) for chunk in self.chunks]

    def get_candidate_by_id(self, cand_id: str) -> Optional[Dict[str, Any]]:
        for candidate in self.candidates_data:
            if candidate.get("member", {}).get("id") == cand_id:
                return candidate
        return None

    def candidate_from_frontend_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        name = config.get("candidateName") or config.get("name") or "Candidate"
        role = config.get("jobRole") or config.get("role") or "AI Engineer"
        years = config.get("experience") or config.get("yearsExperience") or ""
        closest = self.get_candidate_by_id(config.get("candidate_id", "")) if config.get("candidate_id") else None
        if not closest and self.candidates_data:
            closest = self.candidates_data[0]
        candidate = json.loads(json.dumps(closest or {"missions": [], "signals": {}}))
        candidate["member"] = {
            **candidate.get("member", {}),
            "id": candidate.get("member", {}).get("id", "CAND-FRONTEND"),
            "name": name,
            "jobRole": role,
            "yearsExperience": years,
        }
        return candidate

    def get_completed_days(self, candidate_data: Dict[str, Any]) -> List[int]:
        missions = candidate_data.get("missions", [])
        completed = [
            int(m["day"])
            for m in missions
            if m.get("day") is not None and m.get("passed") is True and not m.get("skipped", False)
        ]
        if not completed:
            completed = [chunk["day"] for chunk in self.chunks[:12]]
        return completed

    def get_skipped_days(self, candidate_data: Dict[str, Any]) -> List[int]:
        return [
            int(m["day"])
            for m in candidate_data.get("missions", [])
            if m.get("day") is not None and m.get("skipped") is True
        ]

    def get_weak_days(self, candidate_data: Dict[str, Any]) -> List[int]:
        weak = []
        for mission in candidate_data.get("missions", []):
            day = mission.get("day")
            if day is None:
                continue
            if mission.get("skipped") or not mission.get("passed", True) or mission.get("attempts", 0) >= 3:
                weak.append(int(day))
        return weak

    def _cosine(self, left: Counter, right: Counter) -> float:
        if not left or not right:
            return 0.0
        dot = sum(left[key] * right.get(key, 0) for key in left)
        left_mag = math.sqrt(sum(value * value for value in left.values()))
        right_mag = math.sqrt(sum(value * value for value in right.values()))
        return dot / (left_mag * right_mag) if left_mag and right_mag else 0.0

    def retrieve(
        self,
        query: str,
        candidate_data: Optional[Dict[str, Any]] = None,
        asked_days: Optional[List[int]] = None,
        difficulty: str = "medium",
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        asked_days = asked_days or []
        completed = set(self.get_completed_days(candidate_data or {}))
        skipped = set(self.get_skipped_days(candidate_data or {}))
        weak = set(self.get_weak_days(candidate_data or {}))
        query_vec = Counter(_tokens(query))

        scored: List[Tuple[float, Dict[str, Any]]] = []
        for chunk, vector in zip(self.chunks, self._vectors):
            day = chunk["day"]
            if day in skipped and day not in weak:
                continue
            score = self._cosine(query_vec, vector)
            if day in completed:
                score += 0.35
            if day in weak:
                score += 0.2
            if day in asked_days:
                score -= 0.45
            if difficulty == "easy" and day <= 10:
                score += 0.08
            elif difficulty == "medium" and 10 < day <= 20:
                score += 0.08
            elif difficulty in {"hard", "expert"} and day > 20:
                score += 0.08
            scored.append((score, chunk))

        scored.sort(key=lambda item: (item[0], -item[1]["day"]), reverse=True)
        return [chunk for _, chunk in scored[:top_k]]

    def select_next_topic(
        self,
        candidate_data: Dict[str, Any],
        asked_days: List[int],
        difficulty: str,
        weakness_hint: Optional[str] = None,
        force_diversity: bool = True,
    ) -> Dict[str, Any]:
        completed = self.get_completed_days(candidate_data)
        weak_days = self.get_weak_days(candidate_data)
        query_parts = [weakness_hint or "", " ".join(str(day) for day in weak_days), difficulty]
        candidates = self.retrieve(
            " ".join(query_parts),
            candidate_data=candidate_data,
            asked_days=asked_days,
            difficulty=difficulty,
            top_k=max(8, len(self.chunks)),
        )

        asked_modules = {
            self.days_map.get(day, {}).get("title")
            for day in asked_days
            if day in self.days_map
        }
        for topic in candidates:
            if topic["day"] in completed and topic["day"] not in asked_days:
                if not force_diversity or topic["title"] not in asked_modules or len(set(asked_days)) >= 4:
                    return topic
        for topic in candidates:
            if topic["day"] in completed:
                return topic
        return candidates[0] if candidates else {
            "day": 10,
            "title": "Retrieval & Matching Engine",
            "topic": "Retrieval & Matching Engine",
            "module": "AI Engineering Core",
            "module_title": "AI Engineering Core",
            "tools": ["Python"],
            "objectives": ["Explain the core concept and trade-offs."],
            "learning_objectives": ["Explain the core concept and trade-offs."],
            "content": "Fallback AI engineering curriculum topic.",
        }

    def get_revision_recommendations(self, weak_days: List[int]) -> List[str]:
        recs = []
        seen = set()
        for day in weak_days:
            if day in seen:
                continue
            seen.add(day)
            info = self.days_map.get(day)
            if info:
                recs.append(f"Day {day}: {info.get('title', 'Review topic')}")
        if not recs:
            recs = [
                "Day 22: Multi-Agent Orchestration & Workflow Routing",
                "Day 23: Model Context Protocol (MCP) Integration",
                "Day 28: Docker & Kubernetes Production Deployment",
            ]
        return recs[:5]


knowledge_engine = KnowledgeEngine()
