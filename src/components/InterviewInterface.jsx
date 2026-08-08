import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../hooks/useInterview";
import { EmptyState, ErrorState, LoadingState } from "./common/StateComponents";
import { LockdownTerminationModal } from "./common/LockdownModal";
import "./InterviewInterface.css";

const TOTAL_QUESTIONS = 16;

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
    goToQuestion,
    handleSubmitAnswer,
    handleCompleteInterview,
    reload,
  } = useInterview(interviewId);

  const [lockdownViolationReason, setLockdownViolationReason] = useState(null);

  // Auto navigate on normal complete (when not terminated due to violation)
  useEffect(() => {
    if (isComplete && !lockdownViolationReason) {
      navigate(`/interview/${interviewId}/result`, { replace: true });
    }
  }, [isComplete, lockdownViolationReason, interviewId, navigate]);

  // Lockdown active monitoring effect
  useEffect(() => {
    if (loading || !interview || isComplete || lockdownViolationReason) {
      return;
    }

    const triggerViolation = (reason) => {
      setLockdownViolationReason(reason);
      handleCompleteInterview();

      const attemptedCount = Object.keys(submittedAnswers).length;
      const termReason = reason === "fullscreen" ? "FULLSCREEN_EXIT" : "TAB_SWITCH";
      const termMsg =
        reason === "fullscreen"
          ? "Your test was automatically closed because you exited fullscreen mode during the assessment."
          : "Your test was automatically closed because you switched away from the test page during the assessment.";

      const terminationPayload = {
        isTerminated: true,
        terminationReason: termReason,
        terminationMessage: termMsg,
        questionsAttempted: attemptedCount,
        totalQuestions: TOTAL_QUESTIONS,
      };

      try {
        sessionStorage.setItem(
          `trinity_lockdown_term_${interviewId}`,
          JSON.stringify(terminationPayload)
        );
      } catch {
        // Ignore storage write errors
      }

      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        triggerViolation("visibility");
      }
    };

    const handleWindowBlur = () => {
      triggerViolation("visibility");
    };

    const handleFullscreenChange = () => {
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement
      ) {
        triggerViolation("fullscreen");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    };
  }, [
    loading,
    interview,
    isComplete,
    lockdownViolationReason,
    handleCompleteInterview,
    interviewId,
    submittedAnswers,
    totalQuestions,
  ]);

  const attemptedCount = Object.keys(submittedAnswers).length;
  const currentQuestionNumber = currentQuestionIndex + 1;
  const progressPercent = Math.round((currentQuestionNumber / TOTAL_QUESTIONS) * 100);

  const isLastQuestion = currentQuestionIndex >= TOTAL_QUESTIONS - 1;
  const hasSubmittedCurrent =
    currentQuestion && submittedAnswers[currentQuestion.id] !== undefined;

  const onComplete = async () => {
    await handleCompleteInterview();
    navigate(`/interview/${interviewId}/result`);
  };

  const handleTerminationResultClick = () => {
    const termReason = lockdownViolationReason === "fullscreen" ? "FULLSCREEN_EXIT" : "TAB_SWITCH";
    const termMsg =
      lockdownViolationReason === "fullscreen"
        ? "Your test was automatically closed because you exited fullscreen mode during the assessment."
        : "Your test was automatically closed because you switched away from the test page during the assessment.";

    const terminationPayload = {
      isTerminated: true,
      terminationReason: termReason,
      terminationMessage: termMsg,
      questionsAttempted: attemptedCount,
      totalQuestions: TOTAL_QUESTIONS,
    };

    navigate(`/interview/${interviewId}/result`, {
      state: terminationPayload,
      replace: true,
    });
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

  if (isComplete && !lockdownViolationReason) {
    return null;
  }

  return (
    <div className="interview-page">
      <div className="app-glow" />
      <div className="app-glow-secondary" />

      <LockdownTerminationModal
        isOpen={Boolean(lockdownViolationReason)}
        reason={lockdownViolationReason}
        onViewResult={handleTerminationResultClick}
      />

      <header className="interview-header">
        <button
          type="button"
          className="interview-back"
          onClick={() => navigate("/dashboard")}
          disabled={Boolean(lockdownViolationReason)}
        >
          ← Exit
        </button>

        <div className="interview-logo">TRINITY</div>

        <div className="interview-step">
          QUESTION {String(currentQuestionNumber).padStart(2, "0")}
          <span>/</span>
          {TOTAL_QUESTIONS}
        </div>
      </header>

      <main className="interview-main">
        <div className="page-badge">
          {lockdownViolationReason ? "TEST TERMINATED" : "LIVE INTERVIEW"}
        </div>

        <h1 className="interview-title">
          {interview.role ?? interview.jobRole ?? "Mock Interview"}
        </h1>

        <p className="page-description interview-meta">
          {interview.interviewType && `${interview.interviewType} · `}
          {interview.experience && `${interview.experience}`}
        </p>

        <div className="interview-progress">
          <div className="interview-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="interview-progress-label">
          {progressPercent}% complete (Question {currentQuestionNumber} of {TOTAL_QUESTIONS})
        </p>

        <div className="interview-layout">
          {/* Question Sidebar (Q1 - Q16) */}
          <aside className="interview-sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">Question Map</span>
              <span className="sidebar-attempted-count">
                Attempted: {attemptedCount} / {TOTAL_QUESTIONS}
              </span>
            </div>

            <div className="sidebar-grid">
              {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
                const qNum = i + 1;
                const isCurrent = i === currentQuestionIndex;
                const qId = interview?.questions[i]?.id ?? `q${qNum}`;
                const isAttempted = submittedAnswers[qId] !== undefined;

                let status = "unattempted";
                let icon = "○";
                let statusLabel = "Unattempted";

                if (isCurrent) {
                  status = "current";
                  icon = "●";
                  statusLabel = "Current";
                } else if (isAttempted) {
                  status = "attempted";
                  icon = "✓";
                  statusLabel = "Attempted";
                }

                return (
                  <button
                    key={qNum}
                    type="button"
                    className={`sidebar-slot ${status}`}
                    onClick={() => goToQuestion(i)}
                    disabled={i >= interview?.questions.length || Boolean(lockdownViolationReason)}
                    title={`Q${qNum} - ${statusLabel}`}
                  >
                    <span className="sidebar-slot-icon">{icon}</span>
                    <span>Q{qNum}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Question Area */}
          <div className="interview-content-area">
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
                      Question {currentQuestionNumber} of {TOTAL_QUESTIONS}
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
                      placeholder={
                        lockdownViolationReason
                          ? "Test has been terminated due to a lockdown violation."
                          : "Type your answer here..."
                      }
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      rows={8}
                      disabled={Boolean(lockdownViolationReason) || submitting || completing}
                    />
                  </div>

                  <div className="interview-actions">
                    <button
                      type="button"
                      className="secondary-action-btn"
                      onClick={goToPrevious}
                      disabled={
                        currentQuestionIndex === 0 ||
                        submitting ||
                        completing ||
                        Boolean(lockdownViolationReason)
                      }
                    >
                      Previous
                    </button>

                    {!isLastQuestion ? (
                      <button
                        type="button"
                        className="primary-action-btn"
                        onClick={handleSubmitAnswer}
                        disabled={
                          submitting ||
                          completing ||
                          !answer.trim() ||
                          Boolean(lockdownViolationReason)
                        }
                      >
                        {submitting ? "Saving..." : "Save & Next"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="secondary-action-btn"
                          onClick={handleSubmitAnswer}
                          disabled={
                            submitting ||
                            completing ||
                            !answer.trim() ||
                            Boolean(lockdownViolationReason)
                          }
                        >
                          {submitting ? "Saving..." : "Save Answer"}
                        </button>

                        <button
                          type="button"
                          className="primary-action-btn"
                          onClick={onComplete}
                          disabled={completing || submitting || Boolean(lockdownViolationReason)}
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
                        disabled={submitting || completing || Boolean(lockdownViolationReason)}
                      >
                        Next
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
