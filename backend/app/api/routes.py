import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.personas import PERSONAS
from app.schemas.interview import InterviewRequest, InterviewResponse
from app.services.memory import SessionState, session_manager
from app.services.orchestrator import orchestrator_engine
from app.services.rag_service import knowledge_engine

router = APIRouter()

DEMO_USER = {
    "id": "demo-user",
    "name": "TRINITY Demo User",
    "email": "demo@trinity.local",
}


@router.post("/interview", response_model=InterviewResponse)
async def handle_interview_endpoint(req: InterviewRequest):
    try:
        response_data = orchestrator_engine.handle_turn(
            session_id=req.sessionId,
            candidate_data=req.candidate,
            message=req.message,
            persona_id=req.persona_id or "senior_engineer",
        )
        return InterviewResponse(**response_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interview Engine Error: {exc}") from exc


@router.get("/interviews/configuration")
async def get_interview_configuration():
    return {
        "interviewTypes": ["Technical", "Behavioral", "Mixed"],
        "experienceLevels": ["Fresher", "0-2 years", "2-5 years", "5+ years"],
        "personas": list(PERSONAS.values()),
        "totalQuestions": 16,
        "candidates": [
            {
                "id": c.get("member", {}).get("id"),
                "name": c.get("member", {}).get("name"),
                "jobRole": c.get("member", {}).get("jobRole"),
            }
            for c in knowledge_engine.candidates_data
        ],
    }


@router.post("/interviews")
async def start_interview(config: Dict[str, Any]):
    interview_id = str(uuid.uuid4())
    candidate = None
    candidate_id = config.get("candidate_id") or config.get("candidateId")
    if candidate_id:
        candidate = knowledge_engine.get_candidate_by_id(candidate_id)
    if candidate is None:
        candidate = knowledge_engine.candidate_from_frontend_config(config)
    session = orchestrator_engine.start_session(
        session_id=interview_id,
        candidate_data=candidate,
        persona_id=config.get("persona_id") or config.get("personaId") or "senior_engineer",
        max_questions=int(config.get("totalQuestions") or config.get("max_questions") or 8),
        frontend_config=config,
    )
    return _session_to_frontend(session)


@router.get("/interviews/history")
async def get_interview_history():
    return {
        "interviews": [
            {
                "id": session.session_id,
                "role": session.frontend_config.get("jobRole") or session.candidate.get("member", {}).get("jobRole"),
                "jobRole": session.candidate.get("member", {}).get("jobRole"),
                "interviewType": session.frontend_config.get("interviewType", "Technical"),
                "status": session.status,
                "createdAt": _format_ts(session.created_at),
                "score": (session.feedback or {}).get("overall_score"),
            }
            for session in session_manager.list_sessions()
        ]
    }


@router.get("/interviews/{interview_id}")
async def get_interview(interview_id: str):
    session = _get_session_or_404(interview_id)
    return _session_to_frontend(session)


@router.post("/interviews/{interview_id}/questions/{question_id}/answer")
async def submit_answer(interview_id: str, question_id: str, payload: Dict[str, Any]):
    session = _get_session_or_404(interview_id)
    answer = (payload.get("answer") or "").strip()
    if not answer:
        raise HTTPException(status_code=400, detail="Answer is required")
    try:
        orchestrator_engine.answer_current_question(session, question_id, answer)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _session_to_frontend(session)


@router.post("/interviews/{interview_id}/complete")
async def complete_interview(interview_id: str):
    session = _get_session_or_404(interview_id)
    orchestrator_engine.complete_session(session)
    return _session_to_frontend(session)


@router.get("/interviews/{interview_id}/result")
async def get_interview_result(interview_id: str):
    session = _get_session_or_404(interview_id)
    if session.status != "completed":
        orchestrator_engine.complete_session(session)
    report = session.feedback or {}
    return {
        "id": session.session_id,
        "score": report.get("overall_score", report.get("scorecard", {}).get("overall_score")),
        "summary": report.get("summary"),
        "strengths": report.get("strengths", []),
        "weaknesses": report.get("weaknesses", report.get("gaps", [])),
        "recommendations": report.get("next", []),
        "knowledgeMap": report.get("knowledge_map", session.knowledge_map),
        "interviewDna": report.get("interview_dna", {}),
        "scorecard": report.get("scorecard", {}),
        "areaScores": report.get("area_scores", {}),
        "total_questions": session.max_questions,
        "attempted_questions": len(session.history),
        "unattempted_questions": max(0, session.max_questions - len(session.history)),
        "questionFeedback": [
            {
                "questionId": f"q{idx + 1}",
                "question": item.get("question"),
                "feedback": item.get("evaluation", {}).get("feedback_snippet"),
                "analysis": item.get("evaluation", {}).get("classification"),
            }
            for idx, item in enumerate(session.history)
        ],
    }


@router.get("/candidates")
async def get_candidates_list():
    return {"candidates": knowledge_engine.candidates_data}


@router.get("/personas")
async def get_personas_list():
    return {"personas": list(PERSONAS.values())}


@router.get("/interview/{session_id}/state")
async def get_session_state(session_id: str):
    session = _get_session_or_404(session_id)
    return {
        "session_id": session.session_id,
        "candidate": session.candidate.get("member", {}),
        "persona_id": session.persona_id,
        "difficulty": session.current_difficulty,
        "question_count": len(session.history) + 1,
        "knowledge_map": session.knowledge_map,
        "asked_topics": session.asked_topics,
        "current_topic": session.current_topic,
        "history": session.history,
    }


@router.post("/auth/login")
async def login(payload: Dict[str, Any]):
    return {"token": "trinity-demo-token", "user": {**DEMO_USER, "email": payload.get("email", DEMO_USER["email"])}}


@router.post("/auth/register")
async def register(payload: Dict[str, Any]):
    return {
        "token": "trinity-demo-token",
        "user": {
            **DEMO_USER,
            "name": payload.get("name") or DEMO_USER["name"],
            "email": payload.get("email") or DEMO_USER["email"],
        },
    }


@router.get("/auth/me")
async def me():
    return DEMO_USER


@router.post("/auth/logout")
async def logout():
    return {"ok": True}


def _get_session_or_404(session_id: str) -> SessionState:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


def _session_to_frontend(session: SessionState) -> Dict[str, Any]:
    config = session.frontend_config
    return {
        "id": session.session_id,
        "interviewId": session.session_id,
        "candidateName": session.candidate.get("member", {}).get("name"),
        "role": config.get("jobRole") or session.candidate.get("member", {}).get("jobRole"),
        "jobRole": session.candidate.get("member", {}).get("jobRole"),
        "experience": config.get("experience") or session.candidate.get("member", {}).get("yearsExperience"),
        "interviewType": config.get("interviewType", "Technical"),
        "status": session.status,
        "questions": session.questions,
        "currentQuestionIndex": min(len(session.history), max(len(session.questions) - 1, 0)),
        "submittedAnswers": session.submitted_answers,
        "knowledgeMap": session.knowledge_map,
        "askedTopics": session.asked_topics,
        "currentDifficulty": session.current_difficulty,
        "createdAt": _format_ts(session.created_at),
    }


def _format_ts(ts: float) -> str:
    from datetime import datetime

    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
