from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class FeedbackModel(BaseModel):
    summary: str = Field(..., description="Overall evaluation summary of the candidate's performance")
    strengths: List[str] = Field(default_factory=list, description="Key technical strengths demonstrated")
    gaps: List[str] = Field(default_factory=list, description="Technical knowledge gaps identified")
    next: List[str] = Field(default_factory=list, description="Actionable revision recommendations by curriculum days")

class InterviewRequest(BaseModel):
    sessionId: str = Field(..., description="Unique session identifier for maintaining context")
    candidate: Optional[Dict[str, Any]] = Field(None, description="Candidate profile object sent on interview initialization")
    message: Optional[str] = Field(None, description="Candidate response text sent on subsequent conversation turns")
    persona_id: Optional[str] = Field("senior_engineer", description="Interviewer persona selection")

class EvaluationSummary(BaseModel):
    understanding_level: str = "Knows"  # "Knows", "Partially Knows", "Guessing", "Bluffing"
    technical_accuracy: int = 7
    bluff_detected: bool = False
    bluff_reason: Optional[str] = None
    difficulty_direction: str = "Maintain"  # "Increase", "Decrease", "Maintain"

class InterviewResponse(BaseModel):
    reply: str = Field(..., description="The interviewer response or next interview question")
    done: bool = Field(..., description="True if the interview has concluded, False otherwise")
    feedback: Optional[FeedbackModel] = Field(None, description="Final structured feedback provided when done is True")
    
    # Rich UI metadata fields (Ignored by hackathon evaluator script, used by React UI)
    current_difficulty: Optional[str] = "Medium"
    knowledge_map: Optional[Dict[str, float]] = None
    interview_dna: Optional[Dict[str, Any]] = None
    question_num: Optional[int] = 1
    total_questions: Optional[int] = 8
    evaluation_summary: Optional[EvaluationSummary] = None
