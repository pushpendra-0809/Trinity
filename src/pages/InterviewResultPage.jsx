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

function ScoreHero({ score, isTerminated, attemptedCount, totalQuestions = 16 }) {
  const numScore = Math.round(Number(score) || 0);
  const tier = getScoreTier(numScore);

  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className={`score-hero-card ${tier.tierClass}`}>
      <div className="score-hero-badge">
        TECHNICAL INTERVIEW {isTerminated ? "TERMINATED" : "COMPLETED"}
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
        ● {tier.label}
      </div>

      <div className="score-hero-meta">
        <span>
          Questions Attempted: <strong>{attemptedCount} / {totalQuestions}</strong>
        </span>
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
            {terminationInfo?.isTerminated && (
              <div className="termination-banner">
                <div className="termination-badge">🚫 TEST TERMINATED</div>
                <h2 className="termination-title">
                  {terminationInfo.terminationMessage}
                </h2>
                <p className="termination-explanation">
                  Browser Lockdown was active. Leaving the test page or exiting fullscreen is not permitted during the assessment.
                </p>
                <div className="termination-meta">
                  <span className="termination-meta-item">
                    <strong>Termination Reason:</strong>{" "}
                    {terminationInfo.terminationReason === "FULLSCREEN_EXIT"
                      ? "Fullscreen Exit"
                      : "Tab Switch Detected"}
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
              score={result.score}
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
