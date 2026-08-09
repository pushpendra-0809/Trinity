import { useEffect, useRef, useState } from "react";
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
    handleSkipQuestion,
    handleCompleteInterview,
    handleExitInterview,
    reload,
  } = useInterview(interviewId);

  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [lockdownViolationReason, setLockdownViolationReason] = useState(null);
  const terminalRef = useRef(false);

  const exitFullscreenSafely = () => {
    try {
      const isFS = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (isFS) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch {
      // ignore
    }
  };

  // Auto navigate on normal complete (when not terminated due to violation)
  useEffect(() => {
    if (isComplete && !lockdownViolationReason) {
      exitFullscreenSafely();
      navigate(`/interview/${interviewId}/result`, { replace: true });
    }
  }, [isComplete, lockdownViolationReason, interviewId, navigate]);

  // Frontend Lockdown Monitoring (Sections 1-12)
  useEffect(() => {
    if (loading || !interview || isComplete || lockdownViolationReason || terminalRef.current) {
      return;
    }

    const triggerViolation = (reason) => {
      if (terminalRef.current) return;
      terminalRef.current = true;
      setLockdownViolationReason(reason);
      handleExitInterview("TAB_SWITCH");

      const attemptedCount = Object.keys(submittedAnswers).length;
      const termReason = reason === "fullscreen" ? "FULLSCREEN_EXIT" : "TAB_SWITCH";
      const termMsg =
        reason === "fullscreen"
          ? "You exited fullscreen mode while the test was active. The test has been closed."
          : "Your test has been closed because you switched away from the test page while lockdown mode was active.";

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
        // ignore
      }

      exitFullscreenSafely();
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

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [
    loading,
    interview,
    isComplete,
    lockdownViolationReason,
    handleExitInterview,
    interviewId,
    submittedAnswers,
  ]);

  const attemptedCount = Object.keys(submittedAnswers).length;
  const currentQuestionNumber = currentQuestionIndex + 1;
  const progressPercent = Math.round((currentQuestionNumber / TOTAL_QUESTIONS) * 100);

  const isLastQuestion = currentQuestionIndex >= TOTAL_QUESTIONS - 1;
  const hasSubmittedCurrent =
    currentQuestion && submittedAnswers[currentQuestion.id] !== undefined;

  const onComplete = async () => {
    if (terminalRef.current) return;
    terminalRef.current = true;
    await handleCompleteInterview();
    exitFullscreenSafely();
    navigate(`/interview/${interviewId}/result`, { replace: true });
  };

  const handleTerminationResultClick = () => {
    exitFullscreenSafely();
    const termReason = lockdownViolationReason === "fullscreen" ? "FULLSCREEN_EXIT" : "TAB_SWITCH";
    const termMsg =
      lockdownViolationReason === "fullscreen"
        ? "You exited fullscreen mode while the test was active. The test has been closed."
        : "Your test has been closed because you switched away from the test page while lockdown mode was active.";

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
          className="interview-back exit-test-btn"
          onClick={() => setIsExitModalOpen(true)}
          disabled={Boolean(lockdownViolationReason) || exiting}
          title="Exit interview and evaluate answered questions"
        >
          ✕ Exit Test
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
                const turnItem = interview?.history?.[i];
                const isSkipped = turnItem?.status === "skipped";
                const isAttempted = (submittedAnswers[qId] !== undefined || Boolean(turnItem)) && !isSkipped;

                let status = "unattempted";
                let icon = "○";
                let statusLabel = "Unattempted";

                if (isCurrent) {
                  status = "current";
                  icon = "●";
                  statusLabel = "Current";
                } else if (isSkipped) {
                  status = "skipped";
                  icon = "↷";
                  statusLabel = "Skipped";
                } else if (isAttempted) {
                  status = "attempted";
                  icon = "✓";
                  statusLabel = "Answered";
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
                      disabled={Boolean(lockdownViolationReason) || submitting || completing || exiting}
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
                        exiting ||
                        Boolean(lockdownViolationReason)
                      }
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      className="secondary-action-btn skip-question-btn"
                      onClick={() => setIsSkipModalOpen(true)}
                      disabled={submitting || completing || exiting || Boolean(lockdownViolationReason)}
                      title="Skip this question (0 marks, consumes 1 question slot)"
                    >
                      ↷ Skip Question
                    </button>

                    <button
                      type="button"
                      className="secondary-action-btn exit-test-btn"
                      onClick={() => setIsExitModalOpen(true)}
                      disabled={submitting || completing || exiting || Boolean(lockdownViolationReason)}
                      title="Voluntarily exit and terminate test early"
                    >
                      ✕ Exit Test
                    </button>

                    {!isLastQuestion ? (
                      <button
                        type="button"
                        className="primary-action-btn"
                        onClick={handleSubmitAnswer}
                        disabled={
                          submitting ||
                          completing ||
                          exiting ||
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
                            exiting ||
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
                          disabled={completing || submitting || exiting || Boolean(lockdownViolationReason)}
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
                        disabled={submitting || completing || exiting || Boolean(lockdownViolationReason)}
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

        {/* Skip Confirmation Modal */}
        {isSkipModalOpen && (
          <div className="skip-modal-overlay">
            <div className="skip-modal-card content-card">
              <h3 className="skip-modal-title">Skip this question?</h3>
              <p className="skip-modal-desc">
                Skipped questions receive 0 marks and cannot be answered later.
              </p>
              <div className="skip-modal-actions">
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => setIsSkipModalOpen(false)}
                >
                  Continue Answering
                </button>
                <button
                  type="button"
                  className="primary-action-btn skip-confirm-btn"
                  onClick={async () => {
                    setIsSkipModalOpen(false);
                    await handleSkipQuestion();
                  }}
                >
                  ↷ Skip Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voluntary Exit Confirmation Modal */}
        {isExitModalOpen && (
          <div className="skip-modal-overlay">
            <div className="skip-modal-card content-card exit-modal-card">
              <h3 className="skip-modal-title">Exit Interview?</h3>
              <p className="skip-modal-desc">
                You have not completed all 16 questions.
              </p>
              <ul className="exit-modal-bullets">
                <li>Your current interview will end immediately.</li>
                <li>Unanswered questions will receive 0 marks.</li>
                <li>Your score will be calculated from the full 160-mark test.</li>
                <li>You will not be able to continue or resume this interview.</li>
              </ul>
              <div className="skip-modal-actions">
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => setIsExitModalOpen(false)}
                  disabled={exiting}
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  className="primary-action-btn exit-confirm-btn"
                  disabled={exiting}
                  onClick={async () => {
                    if (terminalRef.current) return;
                    terminalRef.current = true;
                    setExiting(true);
                    try {
                      await handleExitInterview("VOLUNTARY_EXIT");
                      setIsExitModalOpen(false);
                      exitFullscreenSafely();
                      navigate(`/interview/${interviewId}/result`, { replace: true });
                    } catch {
                      setExiting(false);
                      terminalRef.current = false;
                    }
                  }}
                >
                  {exiting ? "Submitting your interview..." : "Exit & Submit Test"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
