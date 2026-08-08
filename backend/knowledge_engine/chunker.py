import logging
from dataclasses import dataclass
from typing import List

from .loader import load_curriculum

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

    # curriculum.json structure has modules and days at root level
    modules = data.get("modules", [])
    days = data.get("days", [])
    
    def get_module_title(day_num: int) -> str:
        for m in modules:
            day_range = m.get("days", [])
            if len(day_range) == 2:
                if day_range[0] <= day_num <= day_range[1]:
                    return m.get("title", "Unknown Module")
            elif len(day_range) == 1:
                if day_range[0] == day_num:
                    return m.get("title", "Unknown Module")
        return "Unknown Module"

    for day_data in days:
        day_num = day_data.get("day", 0)
        module_title = get_module_title(day_num)
        
        day_title = day_data.get("title", "Unknown Title")
        day_type = day_data.get("type", "Unknown Type")
        objectives = day_data.get("objectives", [])
        tools = day_data.get("tools", [])

        # Construct the readable text block exactly as required
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
        
        # Add each objective as a bullet point
        for obj in objectives:
            text_lines.append(f"- {obj}")

        text_lines.append("")
        text_lines.append("Tools:")
        
        # Add each tool as a bullet point
        for tool in tools:
            text_lines.append(f"- {tool}")

        # Join all lines with a newline character
        formatted_text = "\n".join(text_lines)

        # Create the data class instance representing this day
        chunk = CurriculumChunk(
            module=module_title,
            day=day_num,
            title=day_title,
            type=day_type,
            objectives=objectives,
            tools=tools,
            text=formatted_text
        )
        
        chunks.append(chunk)

    return chunks
