import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateComponents";
import { getInterviewResult } from "../services/interviewService";
import "../styles/shared.css";
import "./Result.css";

function ResultSection({ title, children, emptyText }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <section className="result-section">
      <h2>{title}</h2>
      {isEmpty ? <p className="result-empty">{emptyText}</p> : children}
    </section>
  );
}

export default function InterviewResultPage() {
  const { id } = useParams();
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

  return (
    <AppShell>
      <div className="result-page">
        <div className="page-badge">
          {terminationInfo?.isTerminated ? "TEST TERMINATED" : "INTERVIEW RESULTS"}
        </div>

        <h1 className="page-title">
          {terminationInfo?.isTerminated ? "Session Summary" : "Your interview feedback"}
        </h1>

        <p className="page-description result-description">
          {terminationInfo?.isTerminated
            ? "Your assessment session was closed due to a browser lockdown policy event. Your responses up to termination have been evaluated below."
            : "Detailed analysis and recommendations will appear here once the backend generates your results."}
        </p>

        {loading && <LoadingState message="Loading interview results..." />}

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
                    {terminationInfo.questionsAttempted ?? 0} / {terminationInfo.totalQuestions ?? 16}
                  </span>
                </div>
              </div>
            )}

            <ResultSection
              title="Overall Score"
              emptyText="Score will appear here once available from the backend."
            >
              {result.score != null && (
                <div className="result-score">{result.score}%</div>
              )}
            </ResultSection>

            <ResultSection
              title="Area Performance"
              emptyText="Area performance will appear here once available."
            >
              {(result.areaScores || result.knowledgeMap) && (
                <div className="area-performance-grid">
                  {Object.entries(result.areaScores || {}).map(([area, scoreVal]) => (
                    <div key={area} className="area-score-card">
                      <span className="area-name">{area}</span>
                      <span
                        className={`area-score-val ${
                          scoreVal === "Not Assessed" ? "not-assessed" : ""
                        }`}
                      >
                        {scoreVal}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ResultSection>

            <ResultSection
              title="Performance Summary"
              emptyText="Summary will appear here once available."
            >
              {result.summary && <p className="result-text">{result.summary}</p>}
            </ResultSection>

            <ResultSection
              title="Strengths"
              emptyText="Strengths will be listed here once available."
            >
              {Array.isArray(result.strengths) && result.strengths.length > 0 && (
                <ul className="result-list">
                  {result.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </ResultSection>

            <ResultSection
              title="Areas for Improvement"
              emptyText="Improvement areas will be listed here once available."
            >
              {Array.isArray(result.weaknesses) && result.weaknesses.length > 0 && (
                <ul className="result-list">
                  {result.weaknesses.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </ResultSection>

            <ResultSection
              title="Recommendations"
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

            <ResultSection
              title="Question Breakdown"
              emptyText="Question breakdown will appear here once available."
            >
              <div className="question-breakdown-grid">
                {Array.from({ length: 16 }, (_, i) => {
                  const qNum = i + 1;
                  const item = Array.isArray(result.questionFeedback)
                    ? result.questionFeedback[i]
                    : null;
                  const isAttempted = Boolean(item);

                  return (
                    <div
                      key={qNum}
                      className={`breakdown-item ${isAttempted ? "attempted" : "unattempted"}`}
                    >
                      <div className="breakdown-item-header">
                        <span className="breakdown-q-num">Q{qNum}</span>
                        <span className="breakdown-q-text">
                          {isAttempted
                            ? item.question ?? `Question ${qNum}`
                            : `Question ${qNum}`}
                        </span>
                      </div>
                      <span
                        className={`breakdown-status-badge ${
                          isAttempted ? "attempted" : "unattempted"
                        }`}
                      >
                        {isAttempted ? "✓ Attempted" : "○ Not Attempted"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ResultSection>

            <ResultSection
              title="Question-wise Feedback"
              emptyText="Per-question feedback will appear here once available."
            >
              {Array.isArray(result.questionFeedback) && result.questionFeedback.length > 0 && (
                <div className="result-questions">
                  {result.questionFeedback.map((item, index) => (
                    <article key={item.questionId ?? index} className="result-question-item">
                      <h3>{item.question ?? `Question ${index + 1}`}</h3>
                      {item.feedback && <p>{item.feedback}</p>}
                      {item.analysis && <p className="result-analysis">{item.analysis}</p>}
                    </article>
                  ))}
                </div>
              )}
            </ResultSection>

            <div className="result-actions">
              <Link to="/history" className="secondary-action-btn">
                View history
              </Link>
              <Link to="/interview/setup" className="primary-action-btn">
                Start another interview
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
