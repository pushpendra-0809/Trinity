import json
import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings


TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


def _tokens(text: str) -> List[str]:
    return [t.lower() for t in TOKEN_RE.findall(text or "") if len(t) > 2]


def normalize_candidate_name(name: Optional[str]) -> str:
    if not name:
        return ""
    return re.sub(r"\s+", " ", name.strip())


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
        """
        Build a canonical candidate dict from frontend config.

        IMPORTANT (Section 21 — identity invariant):
        - If config contains a known candidate_id, load that candidate's profile.
        - If config contains a candidateName that resolves to a known candidate, use that.
        - Otherwise (new candidate) return an empty profile. Do NOT fall back to
          candidates_data[0] which would silently assign Sarah Johnson's profile to
          any new candidate (the original bug).
        """
        import logging
        log = logging.getLogger("trinity.identity")

        name = config.get("candidateName") or config.get("name") or "Candidate"
        role = config.get("jobRole") or config.get("role") or "AI Engineer"
        years = config.get("experience") or config.get("yearsExperience") or ""

        # ── Step 1: Try to match by candidate_id if explicitly provided ────────
        explicit_cid = (config.get("candidate_id") or "").strip()
        closest = self.get_candidate_by_id(explicit_cid) if explicit_cid else None

        # ── Step 2: If no explicit id, try resolving by name ──────────────────
        if not closest and name and name not in ("Candidate", ""):
            resolved = self.resolve_candidate_identity(name)
            if resolved.get("candidate_type") == "existing":
                closest = resolved.get("raw_record")

        # ── Step 3: Build canonical candidate dict ────────────────────────
        if closest:
            # Existing candidate — deep-copy to avoid mutating candidate.json (Section 19)
            candidate = json.loads(json.dumps(closest))
            actual_cid = candidate.get("member", {}).get("id", explicit_cid or "CAND-UNKNOWN")
            log.info(
                "[candidate_from_frontend_config] EXISTING matched: input_name=%r "
                "candidate_id=%r candidate_type=existing",
                name, actual_cid,
            )
        else:
            # NEW candidate — empty profile (DO NOT use candidates_data[0])
            candidate = {"missions": [], "signals": {}}
            log.info(
                "[candidate_from_frontend_config] NEW candidate: input_name=%r "
                "no candidate.json match",
                name,
            )

        # Override display fields from the frontend input
        candidate["member"] = {
            **candidate.get("member", {}),
            "id": candidate.get("member", {}).get("id") or explicit_cid or f"cand_{name.lower().replace(' ', '_')}",
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
        return recs

    def resolve_candidate_identity(self, name_or_id: Optional[str]) -> Dict[str, Any]:
        """Resolves input against candidate.json. Returns authoritative session identity."""
        import uuid
        raw_name = (name_or_id or "").strip()
        normalized = normalize_candidate_name(raw_name)

        if not normalized:
            cand_id = f"session_cand_{uuid.uuid4().hex[:8]}"
            return {
                "candidate_id": cand_id,
                "candidate_type": "new",
                "display_name": "Candidate",
                "profile_source": "user_entered",
                "job_role": "AI Engineering Scholar",
                "years_experience": 0,
            }

        # Section 24 identity invariant:
        # If the input is already a generated new-candidate id (session_cand_* prefix),
        # return it as-is. Do NOT generate a new id — that breaks the login → interview
        # identity chain for new candidates.
        if normalized.startswith("session_cand_"):
            return {
                "candidate_id": normalized,
                "candidate_type": "new",
                "display_name": "Candidate",
                "profile_source": "user_entered",
                "job_role": "AI Engineering Scholar",
                "years_experience": 0,
            }

        norm_lower = normalized.lower()

        # 1. Match by exact candidate ID (e.g. CAND-001)
        for c in self.candidates_data:
            member = c.get("member", {})
            if member.get("id", "").strip().lower() == norm_lower:
                return {
                    "candidate_id": member.get("id"),
                    "candidate_type": "existing",
                    "display_name": member.get("name"),
                    "profile_source": "candidate.json",
                    "job_role": member.get("jobRole", "AI Engineer"),
                    "years_experience": member.get("yearsExperience", 3),
                    "raw_record": c,
                }

        # 2. Check active sessions in session_manager for matching candidate_id
        try:
            from app.services.memory import session_manager
            for s in session_manager.list_sessions():
                cid = (s.candidate_id or s.candidate.get("candidate_id") or "").strip().lower()
                if cid and cid == norm_lower:
                    return {
                        "candidate_id": s.candidate_id,
                        "candidate_type": s.candidate_type,
                        "display_name": s.display_name,
                        "profile_source": s.candidate.get("profile_source", "user_entered"),
                        "job_role": s.candidate.get("job_role") or "AI Engineer",
                        "years_experience": 0,
                    }
        except Exception:
            pass

        # 3. Match by exact full name (e.g. Sarah Johnson, Rahul Sharma)
        for c in self.candidates_data:
            member = c.get("member", {})
            cand_name = normalize_candidate_name(member.get("name"))
            if cand_name.lower() == norm_lower:
                return {
                    "candidate_id": member.get("id"),
                    "candidate_type": "existing",
                    "display_name": member.get("name"),
                    "profile_source": "candidate.json",
                    "job_role": member.get("jobRole", "AI Engineer"),
                    "years_experience": member.get("yearsExperience", 3),
                    "raw_record": c,
                }

        # 3. Email prefix / name parts match
        email_prefix = norm_lower.split("@")[0].replace(".", " ").replace("_", " ").replace("-", " ").strip()
        if len(email_prefix) >= 3:
            for c in self.candidates_data:
                member = c.get("member", {})
                cand_name = normalize_candidate_name(member.get("name")).lower()
                if cand_name == email_prefix or cand_name in norm_lower:
                    return {
                        "candidate_id": member.get("id"),
                        "candidate_type": "existing",
                        "display_name": member.get("name"),
                        "profile_source": "candidate.json",
                        "job_role": member.get("jobRole", "AI Engineer"),
                        "years_experience": member.get("yearsExperience", 3),
                        "raw_record": c,
                    }

        # 4. Check active sessions in session_manager
        try:
            from app.services.memory import session_manager
            for s in session_manager.list_sessions():
                cid = (s.candidate_id or s.candidate.get("candidate_id") or "").strip().lower()
                if cid and cid == norm_lower:
                    return {
                        "candidate_id": s.candidate_id,
                        "candidate_type": s.candidate_type,
                        "display_name": s.display_name,
                        "profile_source": s.candidate.get("profile_source", "user_entered"),
                        "job_role": s.candidate.get("job_role") or "AI Engineer",
                        "years_experience": 0,
                    }
        except Exception:
            pass

        # 5. New candidate
        cand_id = f"session_cand_{uuid.uuid4().hex[:8]}"
        return {
            "candidate_id": cand_id,
            "candidate_type": "new",
            "display_name": normalized,
            "profile_source": "user_entered",
            "job_role": "AI Engineering Scholar",
            "years_experience": 0,
        }

    def find_candidate(self, query: Optional[str]) -> Optional[Dict[str, Any]]:
        resolved = self.resolve_candidate_identity(query)
        if resolved.get("candidate_type") == "existing":
            return resolved.get("raw_record")
        return None

    def get_dashboard_data(self, candidate_id: Optional[str] = None) -> Dict[str, Any]:
        """Maps candidate.json and session history to the normalized Candidate Dashboard Data Model."""
        from app.services.memory import session_manager

        resolved = self.resolve_candidate_identity(candidate_id)
        candidate_record = resolved.get("raw_record")

        if not candidate_record:
            member = {
                "name": resolved["display_name"],
                "id": resolved["candidate_id"],
                "jobRole": resolved["job_role"],
                "yearsExperience": 0,
            }
            missions = []
            signals = {"commitDays": 0, "missionsCompleted": 0, "missionsFirstTry": 0}
        else:
            member = candidate_record.get("member", {})
            missions = candidate_record.get("missions", [])
            signals = candidate_record.get("signals", {})

        completed_days = sorted([int(m["day"]) for m in missions if m.get("passed") or m.get("attempts", 0) > 0])
        skipped_days = sorted([int(m["day"]) for m in missions if m.get("skipped")])
        total_days = 31
        unique_completed_count = len(set(completed_days))
        progress_pct = round((unique_completed_count / total_days) * 100, 1)

        modules_list = [
            {"name": "Environment & Setup", "range": (1, 3)},
            {"name": "Data Foundations", "range": (4, 6)},
            {"name": "Embeddings & Vector DB", "range": (7, 10)},
            {"name": "LLM Core & Prompting", "range": (11, 15)},
            {"name": "Chatbot Integration", "range": (16, 20)},
            {"name": "Agentic AI & MCP", "range": (21, 24)},
            {"name": "Security & Deployment", "range": (25, 28)},
            {"name": "Production Readiness", "range": (29, 31)},
        ]

        modules_progress = []
        for mod in modules_list:
            start, end = mod["range"]
            total_mod_days = end - start + 1
            mod_completed = sum(1 for d in range(start, end + 1) if d in completed_days)
            mod_pct = round((mod_completed / total_mod_days) * 100)
            modules_progress.append({
                "name": mod["name"],
                "completed": mod_completed,
                "total": total_mod_days,
                "percentage": mod_pct,
            })

        strengths = []
        focus_areas = []
        skipped_topics = []

        if signals.get("missionsFirstTry", 0) >= 15:
            strengths.append("High First-Try Completion (15+ missions)")
        if unique_completed_count > 0:
            strengths.append(f"Solid Curriculum Momentum ({unique_completed_count} Days Completed)")
        else:
            strengths.append("Ready to begin baseline assessment")

        if skipped_days:
            focus_areas.append(f"{len(skipped_days)} Curriculum Topics Skipped (Needs Revision)")
            skipped_topics = [f"Day {d}" for d in skipped_days]
        else:
            focus_areas.append("Production Scalability & System Architecture")

        all_sessions = session_manager.list_sessions_for_candidate(resolved["candidate_id"])
        test_history = []
        import datetime

        for idx, s in enumerate(all_sessions, start=1):
            report = s.feedback or {}
            history_turns = s.history
            skipped_cnt = report.get("skipped", sum(1 for h in history_turns if h.get("status") == "skipped"))
            answered_cnt = report.get(
                "answered",
                sum(
                    1
                    for h in history_turns
                    if h.get("status") not in {"skipped", "not_attempted", "not_reached"}
                    and (h.get("answer") is not None or h.get("attempted", True))
                ),
            )
            correct_cnt = report.get(
                "correct",
                sum(
                    1
                    for h in history_turns
                    if h.get("status") not in {"skipped", "not_attempted", "not_reached"}
                    and h.get("evaluation", {}).get("score", 0) > 0
                ),
            )
            incorrect_cnt = report.get("incorrect", max(0, answered_cnt - correct_cnt))
            not_attempted_cnt = report.get("not_attempted", max(0, 16 - answered_cnt - skipped_cnt))

            dt_str = datetime.datetime.fromtimestamp(s.created_at).strftime("%d %b %Y")

            test_history.append({
                "test_id": s.session_id,
                "test_number": idx,
                "date": dt_str,
                "role": s.candidate.get("member", {}).get("jobRole") or "AI Engineer",
                "score": report.get("earned_marks", sum(h.get("evaluation", {}).get("score", 0) for h in history_turns)),
                "max_score": 160,
                "percentage": report.get("percentage", round((sum(h.get("evaluation", {}).get("score", 0) for h in history_turns) / 160) * 100, 1)),
                "performance_band": report.get("performance_band", "MODERATE"),
                "answered": answered_cnt,
                "correct": correct_cnt,
                "incorrect": incorrect_cnt,
                "skipped": skipped_cnt,
                "not_attempted": not_attempted_cnt,
                "status": s.status,
            })

        rec_title = "Advanced RAG & Vector DB Interview"
        rec_reason = f"Based on your {unique_completed_count} completed curriculum days and strong retrieval performance."
        if unique_completed_count < 10:
            rec_title = "Foundation AI Engineering Assessment"
            rec_reason = "Start with a baseline assessment to evaluate core Python & Data Foundations."

        return {
            "candidate": {
                "name": resolved["display_name"],
                "id": resolved["candidate_id"],
                "candidate_type": resolved["candidate_type"],
                "jobRole": member.get("jobRole", "AI Engineer"),
                "cohort": "ABTalks AI Cohort",
                "experience": f"{member.get('yearsExperience', 0)} years",
            },
            "course_progress": {
                "percentage": progress_pct,
                "completed_days": unique_completed_count,
                "total_days": total_days,
                "current_day": min(31, unique_completed_count + 1),
                "completed_day_list": completed_days,
            },
            "modules": modules_progress,
            "learning_signals": {
                "strengths": strengths,
                "focus_areas": focus_areas,
                "skipped_topics": skipped_topics,
            },
            "test_history": test_history,
            "recommendation": {
                "type": "adaptive_interview",
                "title": rec_title,
                "reason": rec_reason,
            },
        }

    def get_candidate_profile(self, candidate_query: Optional[str] = None) -> Dict[str, Any]:
        """Returns full candidate profile from candidates.json if registered or formatted unregistered fallback."""
        candidate_record = self.find_candidate(candidate_query)


        if candidate_record:
            member = candidate_record.get("member", {})
            missions = candidate_record.get("missions", [])
            signals = candidate_record.get("signals", {})
            return {
                "is_registered": True,
                "status_label": "REGISTERED CANDIDATE",
                "member": {
                    "id": member.get("id", "CAND-001"),
                    "name": member.get("name", "Candidate"),
                    "jobRole": member.get("jobRole", "AI Engineer"),
                    "yearsExperience": member.get("yearsExperience", 3),
                    "education": member.get("education", "BS Computer Science"),
                    "status": member.get("status", "ACTIVE"),
                    "cohort": "ABTalks AI Cohort",
                },
                "signals": {
                    "commitDays": signals.get("commitDays", 0),
                    "missionsCompleted": signals.get("missionsCompleted", len(missions)),
                    "missionsFirstTry": signals.get("missionsFirstTry", 0),
                },
                "missions": missions,
            }
        else:
            return {
                "is_registered": False,
                "status_label": "NEW CANDIDATE",
                "member": {
                    "id": "CAND-NEW",
                    "name": candidate_query or "New Candidate",
                    "jobRole": "AI Engineering Scholar",
                    "yearsExperience": 0,
                    "education": "Self-Taught / Student",
                    "status": "UNREGISTERED",
                    "cohort": "TRINITY AI Cohort",
                },
                "signals": {
                    "commitDays": 0,
                    "missionsCompleted": 0,
                    "missionsFirstTry": 0,
                },
                "missions": [],
                "note": "First-time candidate profile. Complete your first technical assessment to build your engineering credentials.",
            }


knowledge_engine = KnowledgeEngine()

