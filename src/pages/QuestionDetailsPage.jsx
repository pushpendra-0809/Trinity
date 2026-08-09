import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateComponents";
import { getInterviewResult } from "../services/interviewService";
import "../styles/shared.css";
import "./QuestionDetails.css";

const TOTAL_QUESTIONS = 16;

export default function QuestionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'attempted' | 'unattempted'
  const [areaFilter, setAreaFilter] = useState("all"); // 'all' | areaName

  // Expanded card tracking state
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (qNum) => {
    setExpandedCards((prev) => ({
      ...prev,
      [qNum]: !prev[qNum],
    }));
  };

  const getTerminationInfo = () => {
    if (location.state?.isTerminated) {
      return location.state;
    }
    try {
      const stored = sessionStorage.getItem(`trinity_lockdown_term_${id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      return null;
    }
    return null;
  };

  const terminationInfo = getTerminationInfo();

  const loadResult = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getInterviewResult(id);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    async function fetchResult() {
      try {
        const data = await getInterviewResult(id);
        if (isMounted) {
          setResult(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchResult();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const attemptedCount =
    terminationInfo?.questionsAttempted ??
    result?.attempted_questions ??
    (Array.isArray(result?.questionFeedback) ? result.questionFeedback.length : 0);

  const availableAreas = result?.areaScores ? Object.keys(result.areaScores) : [];

  // Generate 16 Question items
  const allQuestionItems = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
    const qNum = i + 1;
    const item = Array.isArray(result?.questionFeedback)
      ? result.questionFeedback[i]
      : null;
    const isSkipped = item?.status === "skipped" || item?.correctness === "skipped";
    const isAttempted = Boolean(item && item.attempted !== false && item.question && !isSkipped);

    let areaName = "General Technical";
    if (availableAreas.length > 0) {
      const areaIdx = Math.floor(i / 2) % availableAreas.length;
      areaName = availableAreas[areaIdx];
    }

    const itemScore = item?.score ?? 0;
    const correctness = isSkipped ? "skipped" : (item?.correctness ?? (isAttempted ? (itemScore > 0 ? "correct" : "incorrect") : "not_attempted"));

    return {
      qNum,
      isAttempted,
      isSkipped,
      question: item?.question ?? `Question ${qNum}`,
      feedback: isSkipped ? "Question skipped by candidate." : (item?.feedback ?? null),
      analysis: isSkipped ? "skipped" : (item?.analysis ?? null),
      score: itemScore,
      timeSpentSeconds: item?.time_spent_seconds ?? 0,
      correctness,
      performanceLevel: isSkipped ? "skipped" : (item?.performance_level ?? (isAttempted ? "strong" : "not_attempted")),
      area: areaName,
    };
  });

  // Filter items
  const filteredQuestions = allQuestionItems.filter((q) => {
    if (statusFilter === "attempted" && !q.isAttempted) return false;
    if (statusFilter === "skipped" && !q.isSkipped) return false;
    if (statusFilter === "unattempted" && (q.isAttempted || q.isSkipped)) return false;
    if (areaFilter !== "all" && q.area !== areaFilter) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="question-details-page">
        <button
          type="button"
          className="details-nav-back"
          onClick={() => navigate(`/interview/${id}/result`, { state: location.state })}
        >
          ← Back to Results
        </button>

        <div className="page-badge">DEDICATED BREAKDOWN</div>
        <h1 className="page-title">Question Attempt Details</h1>
        <p className="page-description">
          Detailed question-by-question response breakdown, scores out of 10 marks, and feedback.
        </p>

        {loading && <LoadingState message="Loading question attempt details..." />}

        {!loading && error && <ErrorState message={error} onRetry={loadResult} />}

        {!loading && !error && !result && (
          <EmptyState
            title="Details not available"
            description="Interview details could not be loaded."
            action={
              <Link to="/dashboard" className="secondary-action-btn">
                Back to dashboard
              </Link>
            }
          />
        )}

        {!loading && !error && result && (
          <div className="content-card">
            {/* Header Compact Summary Bar */}
            <div className="details-summary-bar">
              <div className="summary-metric-item">
                <span className="summary-metric-label">Total Questions</span>
                <span className="summary-metric-value">{TOTAL_QUESTIONS} Questions</span>
              </div>

              <div className="summary-metric-item">
                <span className="summary-metric-label">Earned Marks</span>
                <span className="summary-metric-value">
                  {result.earned_marks ?? Math.round((Number(result.score) || 0) * 1.6)} / 160
                </span>
              </div>

              <div className="summary-metric-item">
                <span className="summary-metric-label">Final Score</span>
                <span className="summary-metric-value">
                  {result.percentage ?? result.score}% ({result.performance_band || "MODERATE"})
                </span>
              </div>

              <div className="summary-metric-item">
                <span className="summary-metric-label">Breakdown</span>
                <span className="summary-metric-value">
                  ✓{result.correct ?? attemptedCount} | ✗{result.incorrect ?? 0} | ↷{result.skipped ?? 0} | ○{result.not_attempted ?? (TOTAL_QUESTIONS - attemptedCount)}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="summary-metric-label">Avg Response Time</span>
                <span className="summary-metric-value" style={{ color: "#38bdf8" }}>
                  {result?.timingAnalysis?.avg_time_per_question ? `${result.timingAnalysis.avg_time_per_question} seconds` : "N/A"}
                </span>
              </div>

              <div className="summary-metric-item">
                <span className="summary-metric-label">Status</span>
                <span
                  className={`summary-metric-value ${
                    terminationInfo?.isTerminated ? "terminated" : ""
                  }`}
                >
                  {terminationInfo?.isTerminated
                    ? `Terminated (${
                        terminationInfo.terminationReason === "FULLSCREEN_EXIT"
                          ? "Fullscreen Exit"
                          : "Tab Switch Detected"
                      })`
                    : "Completed"}
                </span>
              </div>
            </div>

            {/* Filters Toolbar */}
            <div className="details-filters-bar">
              <div className="filter-group">
                <span className="filter-label">STATUS:</span>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab-btn ${statusFilter === "attempted" ? "active" : ""}`}
                    onClick={() => setStatusFilter("attempted")}
                  >
                    Answered
                  </button>
                  <button
                    type="button"
                    className={`filter-tab-btn ${statusFilter === "skipped" ? "active" : ""}`}
                    onClick={() => setStatusFilter("skipped")}
                  >
                    Skipped
                  </button>
                  <button
                    type="button"
                    className={`filter-tab-btn ${statusFilter === "unattempted" ? "active" : ""}`}
                    onClick={() => setStatusFilter("unattempted")}
                  >
                    Not Attempted
                  </button>
                </div>
              </div>

              {availableAreas.length > 0 && (
                <div className="filter-group">
                  <span className="filter-label">AREA:</span>
                  <select
                    className="filter-select"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                  >
                    <option value="all">All Areas</option>
                    {availableAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="details-questions-list">
              {filteredQuestions.length === 0 ? (
                <EmptyState
                  title="No matching questions"
                  description="No questions match your selected status or area filters."
                />
              ) : (
                filteredQuestions.map((q) => {
                  const isExpanded = Boolean(expandedCards[q.qNum]);

                  return (
                    <div
                      key={q.qNum}
                      className={`q-details-card ${
                        q.isSkipped ? "skipped" : q.isAttempted ? "attempted" : "unattempted"
                      }`}
                    >
                      <div className="q-card-header">
                        <div className="q-card-header-left">
                          <span className="q-card-num-badge">Q{q.qNum}</span>
                          <span className="q-card-area-badge">{q.area}</span>
                        </div>

                        <div className="q-card-header-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="q-time-badge" style={{ fontSize: "12px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.08)", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                            ⏱ {q.timeSpentSeconds > 0 ? `${q.timeSpentSeconds}s` : "0s"}
                          </span>
                          <span className="q-score-badge">{q.score} / 10 Marks</span>
                          <span
                            className={`q-status-badge ${
                              q.isSkipped ? "skipped" : q.isAttempted ? "attempted" : "unattempted"
                            }`}
                          >
                            {q.isSkipped
                              ? "↷ Skipped"
                              : q.isAttempted
                              ? "✓ Answered"
                              : "○ Not Attempted"}
                          </span>
                        </div>
                      </div>

                      <h3 className="q-card-text">{q.question}</h3>

                      {q.isAttempted && (
                        <>
                          <button
                            type="button"
                            className="q-eval-toggle-btn"
                            onClick={() => toggleExpand(q.qNum)}
                          >
                            {isExpanded ? "Hide Evaluation ▲" : "View Evaluation ▼"}
                          </button>

                          {isExpanded && (
                            <div className="q-eval-panel">
                              <div className="q-eval-field">
                                <strong>Area:</strong> {q.area}
                              </div>
                              <div className="q-eval-field">
                                <strong>Score:</strong> {q.score} / 10
                              </div>
                              {q.analysis && (
                                <div className="q-eval-field">
                                  <strong>Performance Rating:</strong> {q.analysis}
                                </div>
                              )}
                              {q.feedback && (
                                <div className="q-eval-field">
                                  <strong>Evaluation:</strong> {q.feedback}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
