import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATA_DIR: Path = BASE_DIR / "data"
    CANDIDATES_FILE: Path = DATA_DIR / "candidate.json"
    CURRICULUM_FILE: Path = DATA_DIR / "curriculum.json"
    MAX_QUESTIONS_PER_INTERVIEW: int = 8

settings = Settings()
