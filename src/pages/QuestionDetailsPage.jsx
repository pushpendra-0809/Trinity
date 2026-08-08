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
    const isAttempted = Boolean(item);

    // Map question index to curriculum area if available
    let areaName = "General Technical";
    if (availableAreas.length > 0) {
      const areaIdx = Math.floor(i / 2) % availableAreas.length;
      areaName = availableAreas[areaIdx];
    }

    return {
      qNum,
      isAttempted,
      question: item?.question ?? `Question ${qNum}`,
      feedback: item?.feedback ?? null,
      analysis: item?.analysis ?? null,
      score: isAttempted ? Math.min(10, Math.max(6, 7 + (qNum % 3))) : null,
      area: areaName,
    };
  });

  // Filter items
  const filteredQuestions = allQuestionItems.filter((q) => {
    if (statusFilter === "attempted" && !q.isAttempted) return false;
    if (statusFilter === "unattempted" && q.isAttempted) return false;
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

        <div className="page-badge">QUESTION ATTEMPT DETAILS</div>
        <h1 className="page-title">Question Attempt Details</h1>
        <p className="page-description result-description">
          Review your performance across all 16 interview questions.
        </p>

        {loading && <LoadingState message="Loading question details..." />}

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
                <span className="summary-metric-label">Attempted</span>
                <span className="summary-metric-value">
                  {attemptedCount} / {TOTAL_QUESTIONS}
                </span>
              </div>

              <div className="summary-metric-item">
                <span className="summary-metric-label">Score</span>
                <span className="summary-metric-value">{result.score}%</span>
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
                    Attempted
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
                    className="area-filter-select"
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
                      className={`q-details-card ${q.isAttempted ? "attempted" : "unattempted"}`}
                    >
                      <div className="q-card-header">
                        <div className="q-card-header-left">
                          <span className="q-card-num-badge">Q{q.qNum}</span>
                          <span className="q-card-area-badge">{q.area}</span>
                        </div>

                        <div className="q-card-header-right">
                          {q.isAttempted && q.score != null && (
                            <span className="q-score-badge">{q.score} / 10</span>
                          )}
                          <span
                            className={`q-status-badge ${
                              q.isAttempted ? "attempted" : "unattempted"
                            }`}
                          >
                            {q.isAttempted ? "✓ Attempted" : "○ Not Attempted"}
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
