import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateComponents";
import { useAuth } from "../context/AuthContext";
import { getCandidateDashboard } from "../services/interviewService";
import "../styles/shared.css";
import "./Dashboard.css";

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCandidateDashboard(user?.id || user?.name);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load interview history.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    async function fetchData() {
      try {
        const res = await getCandidateDashboard(user?.id || user?.name);
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load interview history.");
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <LoadingState message="Loading your technical interview history..." />
        </div>
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <ErrorState message={error} onRetry={loadHistory} />
        </div>
      </AppShell>
    );
  }

  const testHistory = data?.test_history || [];
  const completedCount = testHistory.filter((t) => t.status === "completed").length;
  const terminatedCount = testHistory.filter((t) => t.status === "terminated").length;
  const highestScore = testHistory.length > 0 ? Math.max(...testHistory.map((t) => t.percentage || 0)) : 0;

  return (
    <AppShell>
      <div className="dashboard-container">
        {/* History Hero Section */}
        <section className="dashboard-profile-hero content-card">
          <div className="profile-hero-top">
            <div className="profile-info-main">
              <span className="profile-cohort-badge">INTERVIEW HISTORY LOG</span>
              <h1 className="profile-candidate-name">
                Technical Interview History
              </h1>
              <p className="profile-candidate-meta">
                Detailed assessment records, scorecards, and question-level breakdowns for <strong>{user?.name || "Candidate"}</strong>.
              </p>
            </div>

            <button
              type="button"
              className="primary-action-btn dashboard-start-btn"
              onClick={() => navigate("/interview/setup")}
            >
              Start New Test →
            </button>
          </div>

          {/* History Stats Summary Bar */}
          <div className="profile-signals-row" style={{ marginTop: "16px" }}>
            <div className="signal-box">
              <span className="signal-box-val">{testHistory.length}</span>
              <span className="signal-box-lbl">Total Attempted</span>
            </div>
            <div className="signal-box">
              <span className="signal-box-val" style={{ color: "#6ee7b7" }}>{completedCount}</span>
              <span className="signal-box-lbl">Completed Tests</span>
            </div>
            <div className="signal-box">
              <span className="signal-box-val" style={{ color: "#fcd34d" }}>{terminatedCount}</span>
              <span className="signal-box-lbl">Terminated Tests</span>
            </div>
            <div className="signal-box">
              <span className="signal-box-val" style={{ color: "#a9c7ff" }}>{highestScore}%</span>
              <span className="signal-box-lbl">Highest Percentage</span>
            </div>
          </div>
        </section>

        {/* Test History List */}
        <section className="content-card dashboard-section-card">
          <div className="section-header-flex">
            <h2 className="section-card-title">📜 Attempted Interview Records</h2>
            <span className="history-count-badge">
              {testHistory.length} Record{testHistory.length === 1 ? "" : "s"}
            </span>
          </div>

          {testHistory.length === 0 ? (
            <EmptyState
              title="No interviews taken yet"
              description="You have not taken any technical interview assessments yet. Take your first test to build your assessment history."
              action={
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={() => navigate("/interview/setup")}
                >
                  Take Your First Test →
                </button>
              }
            />
          ) : (
            <div className="test-history-grid">
              {testHistory.map((item) => (
                <div key={item.test_id} className="test-history-card">
                  <div className="test-history-header">
                    <div>
                      <span className={`profile-status-badge ${item.status === "completed" ? "registered" : "unregistered"}`}>
                        {item.status === "completed" ? "COMPLETED" : "TERMINATED BY CANDIDATE"}
                      </span>
                      <h3 className="test-card-title">Technical Interview #{item.test_number}</h3>
                      <p className="test-card-date">{item.date} · {item.role}</p>
                    </div>
                    <div className="test-card-score-box">
                      <span className="test-score-pct">{item.percentage}%</span>
                      <span className="test-score-marks">{item.score} / {item.max_score} Marks</span>
                    </div>
                  </div>

                  <div className="test-card-counters">
                    <span className="counter-tag correct">✓ {item.correct} Correct</span>
                    <span className="counter-tag skipped">↷ {item.skipped} Skipped</span>
                    <span className="counter-tag incorrect">✗ {item.incorrect} Incorrect</span>
                    <span className="counter-tag unattempted">○ {item.not_attempted} Not Reached</span>
                    {item.avg_time_per_question > 0 && (
                      <span className="counter-tag time-tag" style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)" }} title="Average Response Time per question">
                        ⏱ {item.avg_time_per_question}s/q
                      </span>
                    )}
                  </div>

                  <div className="test-card-actions" style={{ display: "flex", gap: "10px" }}>
                    <Link to={`/interview/${item.test_id}/result/questions`} className="secondary-action-btn test-view-result-btn">
                      Question Details →
                    </Link>
                    <Link to={`/interview/${item.test_id}/result`} className="primary-action-btn test-view-result-btn">
                      View Scorecard →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
