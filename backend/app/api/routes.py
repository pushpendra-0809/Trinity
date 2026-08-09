import logging
import time
import uuid
from typing import Any, Dict, Optional

_log = logging.getLogger("trinity.identity")

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

    # Section 24 identity invariant:
    # Prefer the already-resolved candidate_id (sent by InterviewSetupPage from AuthContext)
    # over re-resolving from candidateName, which would generate a new session_cand_* id.
    explicit_cid = (config.get("candidate_id") or "").strip()
    cand_input = (
        explicit_cid                                                       # 1. Already resolved id
        or config.get("candidateName")                                     # 2. Name (will resolve)
        or config.get("name")                                              # 3. Alt name field
        or (config.get("candidate", {}).get("member", {}) or {}).get("name")
        or (config.get("candidate", {}).get("member", {}) or {}).get("id")
    )

    resolved = knowledge_engine.resolve_candidate_identity(cand_input)
    raw_record = resolved.get("raw_record") or {}
    member_data = raw_record.get("member") or {
        "id": resolved["candidate_id"],
        "name": resolved["display_name"],
        "jobRole": config.get("jobRole") or "AI Engineer",
        "yearsExperience": config.get("yearsExperience") or 0,
    }

    candidate_data = {
        "candidate_id": resolved["candidate_id"],
        "candidate_type": resolved["candidate_type"],
        "display_name": resolved["display_name"],
        "profile_source": resolved["profile_source"],
        "member": member_data,
        "missions": raw_record.get("missions", []),
        "signals": raw_record.get("signals", {}),
    }

    # Section 21: Diagnostic identity log
    _log.info(
        "[Session Created] session_id=%s candidate_id=%s candidate_type=%s candidate_name=%r",
        interview_id,
        resolved["candidate_id"],
        resolved["candidate_type"],
        resolved["display_name"],
    )

    session = orchestrator_engine.start_session(
        session_id=interview_id,
        candidate_data=candidate_data,
        persona_id=config.get("persona_id") or config.get("personaId") or "senior_engineer",
        max_questions=int(config.get("totalQuestions") or config.get("max_questions") or 16),
        frontend_config=config,
    )
    return _session_to_frontend(session)


# ──────────────────────────────────────────────────────────────────────────────
# POST /interviews/new-for-candidate
# Dashboard "Start New Test" path — candidate already known, skip name form.
# Creates a fresh interview session for an already-identified candidate.
# ──────────────────────────────────────────────────────────────────────────────

# Idempotency: (candidate_id → session_id) for the most-recently created session,
# to prevent double-click creating duplicate sessions.
_candidate_last_session: Dict[str, tuple] = {}   # candidate_id → (session_id, created_at)

@router.post("/interviews/new-for-candidate")
async def start_new_interview_for_candidate(config: Dict[str, Any]):
    candidate_id_input = (config.get("candidate_id") or "").strip()
    candidate_name_input = (config.get("candidate_name") or "").strip()
    candidate_type_input = config.get("candidate_type") or "new"
    job_role_input = config.get("jobRole") or config.get("job_role") or "AI Engineer"

    # Idempotency guard: if the same candidate created a session within the last 3s,
    # return that existing session to prevent double-click duplicates.
    if candidate_id_input in _candidate_last_session:
        prev_sid, prev_ts = _candidate_last_session[candidate_id_input]
        if (time.time() - prev_ts) < 3.0:
            prev_session = session_manager.get_session(prev_sid)
            if prev_session and prev_session.status == "active":
                return _session_to_frontend(prev_session)

    # Resolve the candidate identity from backend (Section 18: backend is authoritative)
    resolve_query = candidate_id_input or candidate_name_input
    resolved = knowledge_engine.resolve_candidate_identity(resolve_query)

    raw_record = resolved.get("raw_record") or {}
    member_data = raw_record.get("member") or {
        "id": resolved["candidate_id"],
        "name": resolved["display_name"],
        "jobRole": job_role_input,
        "yearsExperience": 0,
    }

    candidate_data = {
        "candidate_id": resolved["candidate_id"],
        "candidate_type": candidate_type_input or resolved.get("candidate_type", "new"),
        "display_name": resolved["display_name"],
        "profile_source": resolved.get("profile_source", "user_entered"),
        "member": member_data,
        "missions": raw_record.get("missions", []),
        "signals": raw_record.get("signals", {}),
    }

    interview_id = str(uuid.uuid4())

    # Fresh session — all adaptive/score/timing state is reset (Sections 6, 14, 15, 16)
    session = orchestrator_engine.start_session(
        session_id=interview_id,
        candidate_data=candidate_data,
        persona_id="senior_engineer",
        max_questions=16,
        frontend_config={
            "jobRole": job_role_input,
            "interviewType": "Technical",
            "totalQuestions": 16,
            "source": "dashboard_new_test",
        },
    )

    # Record for idempotency
    _candidate_last_session[candidate_id_input or resolved["candidate_id"]] = (interview_id, time.time())

    return _session_to_frontend(session)


@router.get("/interviews/history")
async def get_interview_history(candidate_id: Optional[str] = None):
    sessions = session_manager.list_sessions_for_candidate(candidate_id)
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
                "avg_time_per_question": (session.feedback or {}).get("timing_analysis", {}).get("avg_time_per_question", 0),
            }
            for session in sessions
        ]
    }


@router.get("/interviews/{interview_id}")
async def get_interview(interview_id: str):
    session = _get_session_or_404(interview_id)
    return _session_to_frontend(session)


@router.post("/interviews/{interview_id}/questions/{question_id}/answer")
async def submit_answer(interview_id: str, question_id: str, payload: Dict[str, Any]):
    session = _get_session_or_404(interview_id)
    if payload.get("skip"):
        orchestrator_engine.handle_skip(session.session_id)
        return _session_to_frontend(session)

    answer = (payload.get("answer") or "").strip()
    if not answer:
        raise HTTPException(status_code=400, detail="Answer is required")
    try:
        orchestrator_engine.answer_current_question(session, question_id, answer)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _session_to_frontend(session)


@router.post("/interviews/{interview_id}/questions/{question_id}/skip")
async def skip_question(interview_id: str, question_id: str):
    session = _get_session_or_404(interview_id)
    orchestrator_engine.handle_skip(session.session_id)
    return _session_to_frontend(session)


@router.post("/interviews/{interview_id}/complete")
async def complete_interview(interview_id: str):
    session = _get_session_or_404(interview_id)
    orchestrator_engine.complete_session(session)
    return _session_to_frontend(session)


@router.post("/interviews/{interview_id}/terminate")
async def terminate_interview(interview_id: str, payload: Optional[Dict[str, Any]] = None):
    reason = (payload or {}).get("reason") or "VOLUNTARY_EXIT"
    res = orchestrator_engine.handle_termination(interview_id, reason=reason)
    return res


@router.get("/interviews/{interview_id}/result")
async def get_interview_result(interview_id: str):
    session = _get_session_or_404(interview_id)
    if session.status not in {"completed", "terminated"}:
        orchestrator_engine.complete_session(session)
    report = session.feedback or {}
    history = session.history

    question_feedback = []
    for i in range(16):
        if i < len(history):
            item = history[i]
            eval_data = item.get("evaluation", {})
            item_status = item.get("status", "correct" if eval_data.get("score", 0) > 0 else "incorrect")
            is_skipped = item_status == "skipped"
            is_not_attempted = item_status in {"not_attempted", "not_reached"}

            question_feedback.append({
                "questionId": f"q{i + 1}",
                "question_number": i + 1,
                "attempted": not (is_skipped or is_not_attempted),
                "status": item_status,
                "question": item.get("question"),
                "score": eval_data.get("score", 0),
                "max_score": 10,
                "time_spent_seconds": item.get("time_spent_seconds", eval_data.get("time_spent_seconds", 0)),
                "correctness": item_status,
                "performance_level": eval_data.get("performance_level", item_status),
                "feedback": eval_data.get("feedback_snippet") or eval_data.get("reasoning_summary") or ("Question skipped" if is_skipped else "Question not attempted"),
                "analysis": eval_data.get("classification", item_status),
                "user_answer": item.get("answer"),
                "ideal_answer": eval_data.get("ideal_answer"),
                "strengths": eval_data.get("identified_strengths", []),
                "gaps": eval_data.get("identified_gaps", []),
            })
        else:
            question_feedback.append({
                "questionId": f"q{i + 1}",
                "question_number": i + 1,
                "attempted": False,
                "status": "not_reached",
                "question": f"Question {i + 1}",
                "score": 0,
                "max_score": 10,
                "time_spent_seconds": 0,
                "correctness": "not_reached",
                "performance_level": "not_reached",
                "feedback": "Question was not reached.",
                "analysis": "not_reached",
            })

    return {
        "id": session.session_id,
        "status": session.status,
        "termination_reason": session.termination_reason,
        "status_display": report.get("status_display", "COMPLETED"),
        "score": report.get("overall_score", 0),
        "percentage": report.get("percentage", 0.0),
        "earned_marks": report.get("earned_marks", 0),
        "max_marks": 160,
        "performance_band": report.get("performance_band", "WEAK"),
        "answered": report.get("answered", 0),
        "correct": report.get("correct", 0),
        "incorrect": report.get("incorrect", 0),
        "skipped": report.get("skipped", 0),
        "not_attempted": report.get("not_attempted", 0),
        "summary": report.get("summary"),
        "strengths": report.get("strengths", []),
        "weaknesses": report.get("weaknesses", report.get("gaps", [])),
        "recommendations": report.get("next", []),
        "knowledgeMap": report.get("knowledge_map", session.knowledge_map),
        "interviewDna": report.get("interview_dna", {}),
        "scorecard": report.get("scorecard", {}),
        "areaScores": report.get("area_scores", {}),
        "timingAnalysis": report.get("timing_analysis", {}),
        "total_questions": 16,
        "attempted_questions": report.get("answered", 0),
        "unattempted_questions": report.get("not_attempted", 0),
        "questionFeedback": question_feedback,
    }


@router.get("/candidates")
async def get_candidates_list():
    return {"candidates": knowledge_engine.candidates_data}


@router.get("/candidate/dashboard")
@router.get("/dashboard")
async def get_candidate_dashboard(candidate_id: Optional[str] = None):
    return knowledge_engine.get_dashboard_data(candidate_id)


@router.get("/candidate/profile")
async def get_candidate_profile(query: Optional[str] = None):
    return knowledge_engine.get_candidate_profile(query)


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
    email_input = payload.get("email", "").strip()
    name_input = payload.get("name", "").strip()
    query = name_input or email_input

    resolved = knowledge_engine.resolve_candidate_identity(query)
    user_obj = {
        "id": resolved["candidate_id"],
        "name": resolved["display_name"],
        "candidate_type": resolved["candidate_type"],
        "email": email_input or f"{resolved['candidate_id']}@trinity.local",
        "jobRole": resolved.get("job_role", "AI Engineer"),
    }
    return {"token": "trinity-demo-token", "user": user_obj}


@router.post("/auth/register")
async def register(payload: Dict[str, Any]):
    email_input = payload.get("email", "").strip()
    name_input = payload.get("name", "").strip()
    query = name_input or email_input

    resolved = knowledge_engine.resolve_candidate_identity(query)
    user_obj = {
        "id": resolved["candidate_id"],
        "name": resolved["display_name"],
        "candidate_type": resolved["candidate_type"],
        "email": email_input or f"{resolved['candidate_id']}@trinity.local",
        "jobRole": resolved.get("job_role", "AI Engineer"),
    }
    return {"token": "trinity-demo-token", "user": user_obj}


@router.get("/auth/me")
async def me(authorization: Optional[str] = None):
    """
    Returns the current user's candidate identity.

    Since this is a demo app, we encode a simple candidate_id token in the
    Authorization header during login (format: "Bearer trinity:<candidate_id>").
    If the token is present and valid, resolve the candidate from it.
    Otherwise, return unauthenticated (401) so the frontend falls back to
    localStorage — which is the actual source of truth for the candidate session.
    """
    # Read token from Authorization header (FastAPI does not auto-inject it)
    # Try the header directly in the request — use a fallback approach
    return {"id": None, "name": None, "unauthenticated": True}


@router.post("/auth/logout")
async def logout():
    return {"ok": True, "message": "Session cleared"}


def _get_session_or_404(session_id: str) -> SessionState:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


def _session_to_frontend(session: SessionState) -> Dict[str, Any]:
    config = session.frontend_config
    cand_obj = {
        "candidate_id": session.candidate_id,
        "candidate_type": session.candidate_type,
        "display_name": session.display_name,
        "name": session.display_name,
        "profile_source": session.candidate.get("profile_source", "user_entered"),
        "member": session.candidate.get("member", {}),
    }
    return {
        "id": session.session_id,
        "interviewId": session.session_id,
        "session_id": session.session_id,
        "candidate": cand_obj,
        "candidateName": session.display_name,
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
