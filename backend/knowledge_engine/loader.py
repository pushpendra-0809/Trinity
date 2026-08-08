import json
import logging
from pathlib import Path
from typing import Dict, Any

# Configure logging for the module
logger = logging.getLogger(__name__)

def load_json(path: Path) -> Dict[str, Any]:
    """
    Load and parse a JSON file from the given path.

    Args:
        path (Path): The pathlib.Path object pointing to the JSON file.

    Returns:
        Dict[str, Any]: A Python dictionary representing the parsed JSON data.

    Raises:
        FileNotFoundError: If the specified file does not exist.
        ValueError: If the file exists but contains invalid JSON data.
    """
    if not path.exists():
        logger.error(f"File not found: {path}")
        raise FileNotFoundError(f"The required data file was not found: {path}")
        
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
            logger.info(f"Successfully loaded JSON file from: {path}")
            return data
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in file {path}: {e}")
        raise ValueError(f"The file {path} contains invalid JSON: {e}") from e

def load_curriculum() -> Dict[str, Any]:
    """
    Load the curriculum data from the local data directory.

    Returns:
        Dict[str, Any]: The parsed curriculum data as a dictionary.
    """
    # Determine the directory where this script is located
    current_dir = Path(__file__).parent
    # Construct the path to the data directory and the specific file
    file_path = current_dir / "data" / "curriculum.json"
    
    return load_json(file_path)

def load_candidates() -> Dict[str, Any]:
    """
    Load the candidates data from the local data directory.

    Returns:
        Dict[str, Any]: The parsed candidate data as a dictionary.
    """
    # Determine the directory where this script is located
    current_dir = Path(__file__).parent
    # Construct the path to the data directory and the specific file
    file_path = current_dir / "data" / "candidates.json"
    
    return load_json(file_path)
