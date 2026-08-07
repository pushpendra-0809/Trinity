from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.config import settings

app = FastAPI(
    title="InterviewOS - Adaptive AI Technical Interviewer Backend",
    description="Stateful AI Interviewer engine with adaptive difficulty, bluff detection, and engineering scorecard generation.",
    version="1.0.0"
)

# Enable CORS for React Frontend (Vite) and cross-origin testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routes under /api prefix
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "InterviewOS AI Engine",
        "official_endpoint": "POST /api/interview",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
