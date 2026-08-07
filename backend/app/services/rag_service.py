import json
from typing import Dict, Any, List, Optional
from app.core.config import settings

class KnowledgeEngine:
    def __init__(self):
        self.candidates_data: List[Dict[str, Any]] = []
        self.curriculum_data: Dict[str, Any] = {}
        self.days_map: Dict[int, Dict[str, Any]] = {}
        self.modules_map: Dict[int, Dict[str, Any]] = {}
        self._load_data()

    def _load_data(self):
        # Load Candidates
        if settings.CANDIDATES_FILE.exists():
            with open(settings.CANDIDATES_FILE, 'r', encoding='utf-8') as f:
                content = json.load(f)
                self.candidates_data = content.get("candidates", [])
        
        # Load Curriculum
        if settings.CURRICULUM_FILE.exists():
            with open(settings.CURRICULUM_FILE, 'r', encoding='utf-8') as f:
                self.curriculum_data = json.load(f)
                days = self.curriculum_data.get("days", [])
                for d in days:
                    self.days_map[d["day"]] = d
                
                modules = self.curriculum_data.get("modules", [])
                for m in modules:
                    self.modules_map[m["n"]] = m

    def get_candidate_by_id(self, cand_id: str) -> Optional[Dict[str, Any]]:
        for c in self.candidates_data:
            if c.get("member", {}).get("id") == cand_id:
                return c
        return None

    def get_completed_days(self, candidate_data: Dict[str, Any]) -> List[int]:
        """Extracts passed mission days for the candidate."""
        missions = candidate_data.get("missions", [])
        completed = []
        for m in missions:
            if m.get("passed") is True:
                completed.append(m.get("day"))
        # Fallback to key curriculum days if no missions found
        if not completed:
            completed = [7, 8, 10, 11, 12, 13, 16, 18, 20, 21, 22, 23, 27, 28, 31]
        return completed

    def get_skipped_days(self, candidate_data: Dict[str, Any]) -> List[int]:
        """Extracts skipped mission days for the candidate."""
        missions = candidate_data.get("missions", [])
        skipped = []
        for m in missions:
            if m.get("skipped") is True:
                skipped.append(m.get("day"))
        return skipped

    def select_next_topic(self, candidate_data: Dict[str, Any], asked_days: List[int], difficulty: str) -> Dict[str, Any]:
        """
        Selects next curriculum day context based on candidate completed missions,
        topics already asked, and current difficulty level.
        """
        completed_days = self.get_completed_days(candidate_data)
        available_days = [d for d in completed_days if d not in asked_days]
        
        if not available_days:
            # Fallback to any completed day or default to core day 10
            available_days = completed_days if completed_days else [10]
            
        # Target day selection algorithm
        target_day = available_days[0]
        
        # Difficulty preference matching:
        # Easy: Days 1-10
        # Medium: Days 11-20
        # Hard / System Design: Days 21-31
        if difficulty == "Easy":
            easy_candidates = [d for d in available_days if d <= 10]
            if easy_candidates:
                target_day = easy_candidates[0]
        elif difficulty == "Medium":
            med_candidates = [d for d in available_days if 10 < d <= 20]
            if med_candidates:
                target_day = med_candidates[0]
        else:  # Hard or System Design
            hard_candidates = [d for d in available_days if d > 20]
            if hard_candidates:
                target_day = hard_candidates[0]
                
        day_info = self.days_map.get(target_day, {
            "day": target_day,
            "title": "Retrieval & Matching Engine",
            "type": "BUILD",
            "tools": ["SQLite", "ChromaDB", "Python"],
            "objectives": ["Build a query router", "Implement vector retrieval", "Evaluate retrieval accuracy"]
        })
        
        # Determine Module Title
        module_title = "AI Engineering Core"
        for mod in self.curriculum_data.get("modules", []):
            days_range = mod.get("days", [1, 31])
            if days_range[0] <= target_day <= days_range[1]:
                module_title = mod.get("title", module_title)
                break

        return {
            "day": target_day,
            "title": day_info.get("title", ""),
            "module_title": module_title,
            "tools": day_info.get("tools", []),
            "objectives": day_info.get("objectives", []),
            "difficulty": difficulty
        }

    def get_revision_recommendations(self, weak_days: List[int]) -> List[str]:
        """Generates actionable revision day recommendations."""
        recs = []
        for d in weak_days:
            info = self.days_map.get(d)
            if info:
                recs.append(f"Day {d}: {info['title']}")
        if not recs:
            recs = [
                "Day 22: Multi-Agent Orchestration & Workflow Routing",
                "Day 23: Model Context Protocol (MCP) Integration",
                "Day 28: Docker & Kubernetes Production Deployment"
            ]
        return recs

knowledge_engine = KnowledgeEngine()
