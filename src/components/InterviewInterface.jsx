import React from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../hooks/useInterview";
import { EmptyState, ErrorState, LoadingState } from "./common/StateComponents";
import "./InterviewInterface.css";

export default function InterviewInterface({ interviewId }) {
  const navigate = useNavigate();

  const {
    interview,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    answer,
    setAnswer,
    submittedAnswers,
    loading,
    submitting,
    completing,
    error,
    isComplete,
    goToPrevious,
    goToNext,
    handleSubmitAnswer,
    handleCompleteInterview,
    reload,
  } = useInterview(interviewId);

  const progress =
    totalQuestions > 0
      ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
      : 0;

  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const hasSubmittedCurrent =
    currentQuestion && submittedAnswers[currentQuestion.id] !== undefined;

  const onComplete = async () => {
    await handleCompleteInterview();
    navigate(`/interview/${interviewId}/result`);
  };

  if (loading) {
    return (
      <div className="interview-page">
        <div className="app-glow" />
        <LoadingState message="Loading interview..." />
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="interview-page">
        <div className="app-glow" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="interview-page">
        <div className="app-glow" />
        <EmptyState
          title="Interview not found"
          description="This interview could not be loaded. It may have been removed or is not available yet."
        />
      </div>
    );
  }

  if (isComplete) {
    navigate(`/interview/${interviewId}/result`, { replace: true });
    return null;
  }

  return (
    <div className="interview-page">
      <div className="app-glow" />
      <div className="app-glow-secondary" />

      <header className="interview-header">
        <button type="button" className="interview-back" onClick={() => navigate("/dashboard")}>
          ← Exit
        </button>

        <div className="interview-logo">TRINITY</div>

        <div className="interview-step">
          QUESTION {String(currentQuestionIndex + 1).padStart(2, "0")}
          <span>/</span>
          {String(totalQuestions).padStart(2, "0")}
        </div>
      </header>

      <main className="interview-main">
        <div className="page-badge">LIVE INTERVIEW</div>

        <h1 className="interview-title">
          {interview.role ?? interview.jobRole ?? "Mock Interview"}
        </h1>

        <p className="page-description interview-meta">
          {interview.interviewType && `${interview.interviewType} · `}
          {interview.experience && `${interview.experience}`}
        </p>

        <div className="interview-progress">
          <div className="interview-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="interview-progress-label">{progress}% complete</p>

        <div className="interview-card content-card">
          {error && <div className="form-error-banner">{error}</div>}

          {!currentQuestion ? (
            <EmptyState
              title="No questions available"
              description="Questions for this interview will appear here once provided by the backend."
            />
          ) : (
            <>
              <div className="interview-question-header">
                <span className="interview-question-number">
                  Question {currentQuestionIndex + 1}
                </span>
                {hasSubmittedCurrent && (
                  <span className="interview-answered-badge">Answer saved</span>
                )}
              </div>

              <h2 className="interview-question-text">
                {currentQuestion.text ?? currentQuestion.question}
              </h2>

              <div className="form-group">
                <label htmlFor="answer">YOUR ANSWER</label>
                <textarea
                  id="answer"
                  className="interview-answer-input"
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={8}
                />
              </div>

              <div className="interview-actions">
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={goToPrevious}
                  disabled={currentQuestionIndex === 0 || submitting || completing}
                >
                  Previous
                </button>

                {!isLastQuestion ? (
                  <button
                    type="button"
                    className="primary-action-btn"
                    onClick={handleSubmitAnswer}
                    disabled={submitting || completing || !answer.trim()}
                  >
                    {submitting ? "Saving..." : "Save & Next"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary-action-btn"
                      onClick={handleSubmitAnswer}
                      disabled={submitting || completing || !answer.trim()}
                    >
                      {submitting ? "Saving..." : "Save Answer"}
                    </button>

                    <button
                      type="button"
                      className="primary-action-btn"
                      onClick={onComplete}
                      disabled={completing || submitting}
                    >
                      {completing ? "Completing..." : "Complete Interview"}
                    </button>
                  </>
                )}

                {!isLastQuestion && hasSubmittedCurrent && (
                  <button
                    type="button"
                    className="secondary-action-btn"
                    onClick={goToNext}
                    disabled={submitting || completing}
                  >
                    Next
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
