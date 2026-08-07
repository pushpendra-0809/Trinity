from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from app.schemas.interview import InterviewRequest, InterviewResponse
from app.services.orchestrator import orchestrator_engine
from app.services.memory import session_manager
from app.services.rag_service import knowledge_engine
from app.core.personas import PERSONAS

router = APIRouter()

@router.post("/interview", response_model=InterviewResponse)
async def handle_interview_endpoint(req: InterviewRequest):
    """
    Official Hackathon Submission Endpoint: POST /api/interview
    Maintains session state and handles turn-by-turn conversational interview flow.
    """
    try:
        response_data = orchestrator_engine.handle_turn(
            session_id=req.sessionId,
            candidate_data=req.candidate,
            message=req.message,
            persona_id=req.persona_id or "senior_engineer"
        )
        return InterviewResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview Engine Error: {str(e)}")

@router.get("/candidates")
async def get_candidates_list():
    """Returns candidate list for Frontend candidate selection dropdown."""
    return {"candidates": knowledge_engine.candidates_data}

@router.get("/personas")
async def get_personas_list():
    """Returns available interviewer persona options."""
    return {"personas": list(PERSONAS.values())}

@router.get("/interview/{session_id}/state")
async def get_session_state(session_id: str):
    """Returns live state of an active interview session for debugging/monitoring."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "candidate": session.candidate.get("member", {}),
        "persona_id": session.persona_id,
        "difficulty": session.current_difficulty,
        "question_count": len(session.history) + 1,
        "knowledge_map": session.knowledge_map,
        "asked_topics": session.asked_topics,
        "history": session.history
    }
