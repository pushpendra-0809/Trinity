import logging
from dataclasses import dataclass
from typing import List

from loader import load_curriculum

logger = logging.getLogger(__name__)

@dataclass
class CurriculumChunk:
    """A data class representing a single day in the curriculum."""
    module: str
    day: int
    title: str
    type: str
    objectives: List[str]
    tools: List[str]
    text: str

def build_chunks() -> List[CurriculumChunk]:
    """
    Loads curriculum data and converts every day into a CurriculumChunk.
    """
    chunks: List[CurriculumChunk] = []
    
    try:
        data = load_curriculum()
    except Exception as e:
        logger.error(f"Failed to load curriculum: {e}")
        return chunks

    cohort = data.get("cohort", {})
    modules = cohort.get("modules", [])

    for module in modules:
        module_title = module.get("title", "Unknown Module")
        
        for day_data in module.get("days", []):
            day_num = day_data.get("day", 0)
            day_title = day_data.get("title", "Unknown Title")
            day_type = day_data.get("type", "Unknown Type")
            objectives = day_data.get("objectives", [])
            tools = day_data.get("tools", [])

            # Generate readable text block
            text_lines = [
                f"Day: {day_num}",
                "",
                f"Module: {module_title}",
                "",
                f"Title: {day_title}",
                "",
                f"Type: {day_type}",
                "",
                "Learning Objectives:"
            ]
            for obj in objectives:
                text_lines.append(f"- {obj}")
                
            text_lines.extend(["", "Tools:"])
            for tool in tools:
                text_lines.append(f"- {tool}")

            text_block = "\n".join(text_lines)

            chunk = CurriculumChunk(
                module=module_title,
                day=day_num,
                title=day_title,
                type=day_type,
                objectives=objectives,
                tools=tools,
                text=text_block
            )
            chunks.append(chunk)

    return chunks
