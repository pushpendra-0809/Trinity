import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateComponents";
import { getInterviewResult } from "../services/interviewService";
import "../styles/shared.css";
import "./Result.css";

function getScoreTier(score) {
  const num = Number(score) || 0;
  if (num >= 90) {
    return { label: "Excellent Performance", tierClass: "excellent", color: "#10b981" };
  }
  if (num >= 75) {
    return { label: "Strong Performance", tierClass: "strong", color: "#38bdf8" };
  }
  if (num >= 60) {
    return { label: "Moderate Performance", tierClass: "moderate", color: "#f59e0b" };
  }
  if (num >= 40) {
    return { label: "Needs Improvement", tierClass: "improvement", color: "#f97316" };
  }
  return { label: "Weak Performance", tierClass: "weak", color: "#ef4444" };
}

function QuestionTimeAnalysisSection({ timingAnalysis, questionFeedback }) {
  const timings = timingAnalysis?.question_timings || questionFeedback || [];
  const avgTime = timingAnalysis?.avg_time_per_question ?? 0;
  const fastest = timingAnalysis?.fastest_question;
  const longest = timingAnalysis?.longest_question;
  const insights = timingAnalysis?.timing_insights || [];

  const maxTime = Math.max(...timings.map((t) => t.time_spent_seconds || 0), 60);

  const getStatusBadge = (t) => {
    const status = t.status || t.correctness || "not_reached";
    if (status === "correct" || status === "partial") {
      return <span className="time-bar-badge status-correct">✓ Correct</span>;
    }
    if (status === "incorrect") {
      return <span className="time-bar-badge status-incorrect">✗ Incorrect</span>;
    }
    if (status === "skipped") {
      return <span className="time-bar-badge status-skipped">↷ Skipped</span>;
    }
    if (status === "not_attempted") {
      return <span className="time-bar-badge status-not-attempted">○ Not Attempted</span>;
    }
    return <span className="time-bar-badge status-not-reached">○ Not Reached</span>;
  };

  return (
    <div className="result-section content-card timing-analysis-card">
      <h3 className="section-card-title">⏱ Question Time Analysis</h3>

      {/* Metric Stat Boxes */}
      <div className="timing-stats-grid">
        <div className="timing-stat-box">
          <span className="timing-stat-val">{avgTime > 0 ? `${avgTime}s` : "N/A"}</span>
          <span className="timing-stat-lbl">Average Response Time</span>
        </div>
        <div className="timing-stat-box">
          <span className="timing-stat-val">
            {fastest ? `Q${fastest.question_number} · ${fastest.time_spent_seconds}s` : "N/A"}
          </span>
          <span className="timing-stat-lbl">Fastest Response</span>
        </div>
        <div className="timing-stat-box">
          <span className="timing-stat-val">
            {longest ? `Q${longest.question_number} · ${longest.time_spent_seconds}s` : "N/A"}
          </span>
          <span className="timing-stat-lbl">Longest Response</span>
        </div>
      </div>

      {/* Horizontal Bar Chart Visualization (Section 19) */}
      <div className="timing-bars-container">
        <h4 className="timing-bars-subtitle">Per-Question Thinking Duration Bar Chart</h4>
        <div className="timing-bars-list">
          {timings.map((t, index) => {
            const qNum = t.question_number || index + 1;
            const spentSecs = t.time_spent_seconds || 0;
            const pct = maxTime > 0 ? Math.max(spentSecs > 0 ? 8 : 0, Math.min(100, (spentSecs / maxTime) * 100)) : 0;
            const status = t.status || t.correctness || "not_reached";

            let barColor = "#64748b";
            if (status === "correct" || status === "partial") barColor = "#10b981";
            else if (status === "incorrect") barColor = "#ef4444";
            else if (status === "skipped") barColor = "#f59e0b";

            return (
              <div key={qNum} className="timing-bar-row">
                <span className="timing-row-label">Q{qNum}</span>
                <div className="timing-row-track">
                  <div
                    className="timing-row-fill"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="timing-row-time">{spentSecs > 0 ? `${spentSecs}s` : "0s"}</span>
                <div className="timing-row-badge">{getStatusBadge(t)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights (Section 21, 22) */}
      {insights.length > 0 && (
        <div className="timing-insights-box">
          <h4 className="timing-insights-title">💡 Cognitive & Timing Insights</h4>
          <ul className="timing-insights-list">
            {insights.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreHero({ result, isTerminated, totalQuestions = 16 }) {
  const earnedMarks = result.earned_marks ?? Math.round((Number(result.score) || 0) * 1.6);
  const maxMarks = result.max_marks || 160;
  const numScore = Math.round(Number(result.score) || 0);
  const tier = getScoreTier(numScore);
  const performanceBand = result.performance_band || tier.label.toUpperCase();

  const answeredCount = result.answered ?? result.attempted_questions ?? 0;
  const skippedCount = result.skipped ?? 0;
  const notAttemptedCount = result.not_attempted ?? Math.max(0, totalQuestions - answeredCount - skippedCount);
  const correctCount = result.correct ?? 0;
  const incorrectCount = result.incorrect ?? Math.max(0, answeredCount - correctCount);

  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className={`score-hero-card ${tier.tierClass}`}>
      <div className="score-hero-badge">
        TECHNICAL INTERVIEW {result.termination_reason === "VOLUNTARY_EXIT" ? "VOLUNTARILY EXITED" : isTerminated ? "TERMINATED" : "COMPLETED"}
      </div>

      <div className="score-ring-container">
        <svg className="score-ring-svg" viewBox="0 0 160 160">
          <circle
            className="score-ring-bg"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="score-ring-progress"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            stroke={tier.color}
          />
        </svg>
        <div className="score-ring-content">
          <span className="score-ring-val">{numScore}</span>
          <span className="score-ring-denom">/ 100</span>
        </div>
      </div>

      <div className="score-hero-status" style={{ color: tier.color }}>
        ● {performanceBand} ({earnedMarks} / {maxMarks} Marks)
      </div>

      <div className="score-breakdown-counters">
        <div className="counter-item correct" title="Answered correctly or partially">
          <span className="counter-val">✓ {correctCount}</span>
          <span className="counter-lbl">Correct</span>
        </div>
        <div className="counter-item incorrect" title="Answered incorrectly">
          <span className="counter-val">✗ {incorrectCount}</span>
          <span className="counter-lbl">Incorrect</span>
        </div>
        <div className="counter-item skipped" title="Question skipped by candidate (0 marks)">
          <span className="counter-val">↷ {skippedCount}</span>
          <span className="counter-lbl">Skipped</span>
        </div>
        <div className="counter-item unattempted" title="Questions neither answered nor skipped (0 marks)">
          <span className="counter-val">○ {notAttemptedCount}</span>
          <span className="counter-lbl">Not Attempted</span>
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, children, emptyText }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <section className="result-section">
      {title && <h2>{title}</h2>}
      {isEmpty ? <p className="result-empty">{emptyText}</p> : children}
    </section>
  );
}

export default function InterviewResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    // Result page MUST always run in normal browser mode
    try {
      const isFS = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (isFS && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }

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

  const totalQuestions =
    terminationInfo?.totalQuestions ?? result?.total_questions ?? 16;

  return (
    <AppShell>
      <div className="result-page">
        <div className="page-badge">
          {terminationInfo?.isTerminated ? "TEST TERMINATED" : "TECHNICAL SCORECARD"}
        </div>

        <h1 className="page-title">
          {terminationInfo?.isTerminated ? "Assessment Session Summary" : "Candidate Assessment Report"}
        </h1>

        <p className="page-description result-description">
          {terminationInfo?.isTerminated
            ? "Your assessment session was closed due to a browser lockdown policy event. Evaluated metrics for attempted questions are presented below."
            : "Comprehensive AI technical evaluation report detailing competency scores, area breakdown, and recommended next steps."}
        </p>

        {loading && <LoadingState message="Generating scorecard..." />}

        {!loading && error && <ErrorState message={error} onRetry={loadResult} />}

        {!loading && !error && !result && (
          <EmptyState
            title="Results not available yet"
            description="Your interview results will appear here once analysis is complete."
            action={
              <Link to="/dashboard" className="secondary-action-btn">
                Back to dashboard
              </Link>
            }
          />
        )}

        {!loading && !error && result && (
          <div className="content-card result-card">
            {result.termination_reason === "VOLUNTARY_EXIT" ? (
              <div className="termination-banner voluntary-exit-banner">
                <div className="termination-badge warning">⚠ TEST TERMINATED BY CANDIDATE</div>
                <h2 className="termination-title">
                  You voluntarily exited the interview before completing all 16 questions.
                </h2>
                <p className="termination-explanation">
                  Your final score was calculated using the full 160-mark denominator. Unanswered questions received 0 marks and are marked as Not Attempted.
                </p>
                <div className="termination-meta">
                  <span className="termination-meta-item">
                    <strong>Status:</strong> Voluntarily Exited
                  </span>
                  <span className="termination-meta-item">
                    <strong>Termination Reason:</strong> Voluntary Exit
                  </span>
                  <span className="termination-meta-item">
                    <strong>Answered:</strong> {result.answered ?? attemptedCount} / {totalQuestions}
                  </span>
                  <span className="termination-meta-item">
                    <strong>Skipped:</strong> {result.skipped ?? 0} / {totalQuestions}
                  </span>
                  <span className="termination-meta-item">
                    <strong>Not Attempted:</strong> {result.not_attempted ?? 0} / {totalQuestions}
                  </span>
                </div>
              </div>
            ) : (terminationInfo?.isTerminated || result.status === "terminated") && (
              <div className="termination-banner">
                <div className="termination-badge">🚫 TEST TERMINATED</div>
                <h2 className="termination-title">
                  {terminationInfo?.terminationMessage || "Your assessment session was closed due to a lockdown policy event."}
                </h2>
                <p className="termination-explanation">
                  Browser Lockdown was active. Leaving the test page or exiting fullscreen is not permitted during the assessment.
                </p>
                <div className="termination-meta">
                  <span className="termination-meta-item">
                    <strong>Termination Reason:</strong>{" "}
                    {result.termination_reason || (terminationInfo?.terminationReason === "FULLSCREEN_EXIT"
                      ? "Fullscreen Exit"
                      : "Tab Switch Detected")}
                  </span>
                  <span className="termination-meta-item">
                    <strong>Questions Attempted:</strong>{" "}
                    {attemptedCount} / {totalQuestions}
                  </span>
                </div>
              </div>
            )}

            {/* ==================================================
               SECTION A: MAIN PERFORMANCE DASHBOARD
            ================================================== */}
            <div className="dashboard-section-title">
              Section A: Main Performance Dashboard
            </div>

            {/* Main Score Hero (Circular Gauge & Tier Badge) */}
            <ScoreHero
              result={result}
              isTerminated={Boolean(terminationInfo?.isTerminated)}
              attemptedCount={attemptedCount}
              totalQuestions={totalQuestions}
            />

            {/* Performance by Area */}
            <ResultSection
              title="Performance by Area"
              emptyText="Area performance metrics will appear here once available."
            >
              {(result.areaScores || result.knowledgeMap) && (
                <div className="area-performance-grid">
                  {Object.entries(result.areaScores || {}).map(([area, scoreVal]) => {
                    const isNotAssessed = scoreVal === "Not Assessed";
                    const numericVal = isNotAssessed
                      ? 0
                      : parseInt(String(scoreVal).replace("%", ""), 10) || 0;

                    return (
                      <div key={area} className="area-score-card">
                        <div className="area-card-top">
                          <span className="area-name">{area}</span>
                          <span
                            className={`area-score-val ${isNotAssessed ? "not-assessed" : ""}`}
                          >
                            {scoreVal}
                          </span>
                        </div>
                        {!isNotAssessed && (
                          <div className="area-bar-track">
                            <div
                              className="area-bar-fill"
                              style={{ width: `${Math.min(100, Math.max(0, numericVal))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ResultSection>

            {/* Question Time Analysis Section (Sections 18-22) */}
            <QuestionTimeAnalysisSection
              timingAnalysis={result.timingAnalysis}
              questionFeedback={result.questionFeedback}
            />

            {/* Performance Summary */}
            <ResultSection
              title="Performance Summary & Technical Profile"
              emptyText="Summary will appear here once available."
            >
              {result.summary && <p className="result-text">{result.summary}</p>}
            </ResultSection>

            {/* Strengths & Weaknesses (Two Column Dashboard Grid) */}
            <div className="dashboard-two-col">
              <div className="dashboard-col-card strengths-card">
                <h3 className="dashboard-col-title">
                  <span>✓</span> Demonstrated Strengths
                </h3>
                {Array.isArray(result.strengths) && result.strengths.length > 0 ? (
                  <ul className="result-list">
                    {result.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="result-empty">Strengths will be listed here once available.</p>
                )}
              </div>

              <div className="dashboard-col-card weaknesses-card">
                <h3 className="dashboard-col-title">
                  <span>!</span> Areas for Improvement
                </h3>
                {Array.isArray(result.weaknesses) && result.weaknesses.length > 0 ? (
                  <ul className="result-list">
                    {result.weaknesses.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="result-empty">Improvement areas will be listed here once available.</p>
                )}
              </div>
            </div>

            {/* Recommendations Roadmap */}
            <ResultSection
              title="Recommended Action Steps"
              emptyText="Recommendations will appear here once available."
            >
              {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                <ul className="result-list">
                  {result.recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </ResultSection>

            <div className="result-actions">
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => navigate(`/interview/${id}/result/questions`, { state: location.state })}
              >
                View Question Attempt Details →
              </button>
              <Link to="/history" className="secondary-action-btn">
                View history
              </Link>
              <Link to="/interview/setup" className="secondary-action-btn">
                Start another interview
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
