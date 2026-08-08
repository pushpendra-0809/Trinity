import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadResult = async () => {
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
  };

  useEffect(() => {
    loadResult();
  }, [id]);

  return (
    <AppShell>
      <div className="result-page">
        <div className="page-badge">INTERVIEW RESULTS</div>
        <h1 className="page-title">Your interview feedback</h1>
        <p className="page-description result-description">
          Detailed analysis and recommendations will appear here once the backend generates your results.
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
            <ResultSection
              title="Overall Score"
              emptyText="Score will appear here once available from the backend."
            >
              {result.score != null && (
                <div className="result-score">{result.score}</div>
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
