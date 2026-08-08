import os
from pathlib import Path
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-2.5-flash")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "local-tfidf")
    DATA_DIR: Path = BASE_DIR / "data"
    CANDIDATES_FILE: Path = DATA_DIR / "candidate.json"
    CURRICULUM_FILE: Path = DATA_DIR / "curriculum.json"
    MAX_QUESTIONS_PER_INTERVIEW: int = 8

settings = Settings()
