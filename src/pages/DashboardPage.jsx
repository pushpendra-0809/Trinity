import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateComponents";
import { useAuth } from "../context/AuthContext";
import { getCandidateDashboard } from "../services/interviewService";
import "../styles/shared.css";
import "./Dashboard.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Section 24 identity invariant: always use candidate_id (user.id), never user.name.
      // user.id is set by the backend during login/register from candidate.json resolution.
      const res = await getCandidateDashboard(user?.id);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load candidate dashboard.");
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
        // Section 24 identity invariant: candidate_id is user.id, never user.name.
        const res = await getCandidateDashboard(user?.id);
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load candidate dashboard.");
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
          <LoadingState message="Loading your TRINITY Candidate Dashboard..." />
        </div>
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <ErrorState message={error} onRetry={loadDashboard} />
        </div>
      </AppShell>
    );
  }

  const candidate = data?.candidate || {};
  const courseProgress = data?.course_progress || { percentage: 0, completed_days: 0, total_days: 31 };
  const modules = data?.modules || [];
  const signals = data?.learning_signals || { strengths: [], focus_areas: [], skipped_topics: [] };
  const testHistory = data?.test_history || [];
  const recommendation = data?.recommendation || {};

  const isNewCandidate = courseProgress.completed_days === 0 && testHistory.length === 0;

  // SVG Circular Gauge Setup
  const radius = 54;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (courseProgress.percentage / 100) * circumference;

  return (
    <AppShell>
      <div className="dashboard-container">
        {/* Header Hero Section */}
        <section className="dashboard-profile-hero content-card">
          <div className="profile-hero-top">
            <div className="profile-info-main">
              <span className="profile-cohort-badge">{candidate.cohort || "TRINITY AI Cohort"}</span>
              <h1 className="profile-candidate-name">
                {isNewCandidate ? `Welcome, ${candidate.name || user?.name || "Candidate"} 👋` : `Welcome back, ${candidate.name || user?.name || "Candidate"} 👋`}
              </h1>
              <p className="profile-candidate-meta">
                ID: <strong>{candidate.id || "CAND-001"}</strong> · Track: <strong>{candidate.jobRole || "AI Engineer"}</strong> · Experience: <strong>{candidate.experience || "2-5 years"}</strong>
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="profile-gauge-box">
              <svg className="dashboard-gauge-svg" viewBox="0 0 130 130">
                <circle className="gauge-bg" cx="65" cy="65" r={radius} strokeWidth={strokeWidth} />
                <circle
                  className="gauge-progress"
                  cx="65"
                  cy="65"
                  r={radius}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="gauge-text-content">
                <span className="gauge-percentage">{courseProgress.percentage}%</span>
                <span className="gauge-label">COMPLETE</span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Counter */}
          <div className="profile-progress-bar-wrapper">
            <div className="profile-progress-bar-container">
              <div className="profile-progress-fill" style={{ width: `${courseProgress.percentage}%` }} />
            </div>
            <div className="profile-progress-labels">
              <span>🎯 <strong>{courseProgress.completed_days}</strong> / {courseProgress.total_days} Curriculum Days Completed</span>
              <span>Day {courseProgress.current_day} Active</span>
            </div>
          </div>
        </section>

        {/* Action Callout & Personal Recommendation */}
        <section className="dashboard-cta-section content-card">
          <div className="recommendation-badge">RECOMMENDED NEXT STEP</div>
          <div className="recommendation-content">
            <div className="recommendation-text">
              <h2>{recommendation.title || "Technical Baseline Assessment"}</h2>
              <p>{recommendation.reason || "Assess your current engineering knowledge and trade-off capabilities."}</p>
            </div>

            <button
              type="button"
              className="primary-action-btn dashboard-start-btn"
              onClick={() => navigate("/interview/new")}
            >
              {isNewCandidate ? "Take Your First Test →" : "Start New Interview →"}
            </button>
          </div>
        </section>

        {/* Grid: Module Progress & Learning Insights */}
        <div className="dashboard-two-col-grid">
          {/* Module-level Progress Cards */}
          <section className="content-card dashboard-section-card">
            <h2 className="section-card-title">📚 Module Progress</h2>
            <div className="modules-list-grid">
              {modules.map((mod) => (
                <div key={mod.name} className="module-item-card">
                  <div className="module-item-header">
                    <span className="module-item-name">{mod.name}</span>
                    <span className="module-item-pct">{mod.percentage}%</span>
                  </div>
                  <div className="module-bar-track">
                    <div className="module-bar-fill" style={{ width: `${mod.percentage}%` }} />
                  </div>
                  <span className="module-item-sub">
                    {mod.completed} / {mod.total} Days Completed
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Learning Insights & Signals */}
          <section className="content-card dashboard-section-card">
            <h2 className="section-card-title">⚡ Learning Signals</h2>

            <div className="signals-grid">
              <div className="signal-card strength">
                <div className="signal-card-header">
                  <span className="signal-icon">💪</span>
                  <span className="signal-title">Demonstrated Strengths</span>
                </div>
                <ul className="signal-list">
                  {signals.strengths.length > 0 ? (
                    signals.strengths.map((st, i) => <li key={i}>{st}</li>)
                  ) : (
                    <li>Complete your first assessment to unlock strengths analysis.</li>
                  )}
                </ul>
              </div>

              <div className="signal-card focus">
                <div className="signal-card-header">
                  <span className="signal-icon">📌</span>
                  <span className="signal-title">Focus & Revision Areas</span>
                </div>
                <ul className="signal-list">
                  {signals.focus_areas.length > 0 ? (
                    signals.focus_areas.map((fa, i) => <li key={i}>{fa}</li>)
                  ) : (
                    <li>No major gaps identified yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Curriculum Timeline */}
        <section className="content-card dashboard-section-card">
          <h2 className="section-card-title">🗺️ 31-Day Curriculum Journey</h2>
          <div className="timeline-grid">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const isCompleted = courseProgress.completed_day_list?.includes(dayNum);
              const isCurrent = dayNum === courseProgress.current_day;

              let dayStatus = "unreached";
              let symbol = "○";
              if (isCompleted) {
                dayStatus = "completed";
                symbol = "✓";
              } else if (isCurrent) {
                dayStatus = "current";
                symbol = "→";
              }

              return (
                <div key={dayNum} className={`timeline-day-pill ${dayStatus}`}>
                  <span className="pill-symbol">{symbol}</span>
                  <span className="pill-day">D{dayNum}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Test History Section */}
        <section className="content-card dashboard-section-card">
          <div className="section-header-flex">
            <h2 className="section-card-title">📜 Technical Test History</h2>
            <span className="history-count-badge">
              {testHistory.length} Test{testHistory.length === 1 ? "" : "s"} Taken
            </span>
          </div>

          {testHistory.length === 0 ? (
            <EmptyState
              title="No interviews taken yet"
              description="Your first technical interview assessment is ready. Click below to begin your adaptive evaluation."
              action={
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={() => navigate("/interview/new")}
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
                      <h3 className="test-card-title">Technical Interview #{item.test_number}</h3>
                      <p className="test-card-date">{item.date} · {item.role}</p>
                    </div>
                    <div className="test-card-score-box">
                      <span className="test-score-pct">{item.percentage}%</span>
                      <span className="test-score-marks">{item.score} / {item.max_score} Marks</span>
                    </div>
                  </div>

                  <div className="test-card-counters">
                    <span className="counter-tag correct">✓ {item.answered} Answered ({item.correct} Correct)</span>
                    <span className="counter-tag skipped">↷ {item.skipped} Skipped</span>
                    <span className="counter-tag unattempted">○ {item.not_attempted} Not Attempted</span>
                    {item.avg_time_per_question > 0 && (
                      <span className="counter-tag time-tag" style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)" }} title="Average Response Time per question">
                        ⏱ {item.avg_time_per_question}s/q
                      </span>
                    )}
                  </div>

                  <div className="test-card-actions">
                    <Link to={`/interview/${item.test_id}/result`} className="secondary-action-btn test-view-result-btn">
                      View Result Scorecard →
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
