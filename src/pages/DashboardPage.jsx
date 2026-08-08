import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateComponents";
import { useAuth } from "../context/AuthContext";
import { getInterviewHistory } from "../services/interviewService";
import "../styles/shared.css";
import "./Dashboard.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInterviewHistory();
      setHistory(Array.isArray(data) ? data : data?.interviews ?? []);
    } catch (err) {
      setError(err.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const recentInterviews = history?.slice(0, 3) ?? [];

  return (
    <AppShell>
      <section className="dashboard-hero">
        <div className="page-badge">DASHBOARD</div>
        <h1 className="dashboard-title">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="page-description dashboard-description">
          Prepare for your next interview, review past sessions, and track your performance.
        </p>

        <Link to="/interview/setup" className="primary-action-btn dashboard-cta">
          Start Interview
          <span>→</span>
        </Link>
      </section>

      <section className="dashboard-grid">
        <article className="content-card dashboard-card">
          <h2>Recent Interviews</h2>

          {loading && <LoadingState message="Loading recent interviews..." />}

          {!loading && error && (
            <ErrorState message={error} onRetry={loadHistory} />
          )}

          {!loading && !error && recentInterviews.length === 0 && (
            <EmptyState
              title="No interviews yet"
              description="Your recent interviews will appear here after you complete a session."
              action={
                <Link to="/interview/setup" className="secondary-action-btn">
                  Start your first interview
                </Link>
              }
            />
          )}

          {!loading && !error && recentInterviews.length > 0 && (
            <ul className="dashboard-list">
              {recentInterviews.map((item) => (
                <li key={item.id} className="dashboard-list-item">
                  <div>
                    <strong>{item.role ?? item.jobRole ?? "Interview"}</strong>
                    <p>
                      {item.date ?? item.createdAt ?? "—"} · {item.status ?? "—"}
                    </p>
                  </div>
                  {item.status === "completed" && (
                    <Link to={`/interview/${item.id}/result`} className="text-link">
                      View result
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="content-card dashboard-card">
          <h2>Performance & Feedback</h2>

          {loading && <LoadingState message="Loading performance data..." />}

          {!loading && (
            <EmptyState
              title="No performance data yet"
              description="Complete an interview to receive AI-generated feedback and performance insights."
            />
          )}
        </article>

        <article className="content-card dashboard-card dashboard-card-wide">
          <div className="dashboard-card-header">
            <h2>Interview History</h2>
            <Link to="/history" className="text-link">
              View all
            </Link>
          </div>

          {loading && <LoadingState message="Loading history..." />}

          {!loading && !error && (history?.length ?? 0) === 0 && (
            <EmptyState
              title="No history yet"
              description="Your interview history will appear here after you complete an interview."
            />
          )}

          {!loading && !error && (history?.length ?? 0) > 0 && (
            <p className="dashboard-summary">
              You have {history.length} interview{history.length === 1 ? "" : "s"} on record.
            </p>
          )}
        </article>
      </section>
    </AppShell>
  );
}
