import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/shared.css";
import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isApiConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="app-glow" />
      <div className="app-glow-secondary" />

      <header className="login-header">
        <Link to="/" className="login-back">
          ← Back
        </Link>
        <div className="login-logo">TRINITY</div>
      </header>

      <main className="login-main">
        <div className="page-badge">SIGN IN</div>

        <h1 className="page-title">
          Welcome back to
          <span className="login-title-accent"> Trinity.</span>
        </h1>

        <p className="page-description">
          Sign in to access your dashboard, interview history, and personalized feedback.
        </p>

        {!isApiConfigured && (
          <div className="form-error-banner login-banner">
            Backend is not configured yet. Set <code>VITE_API_BASE_URL</code> to connect authentication.
          </div>
        )}

        <form className="login-card content-card" onSubmit={handleSubmit}>
          {error && <div className="form-error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="candidate-preset">QUICK CANDIDATE SELECT</label>
            <div className="preset-candidate-buttons" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                className="secondary-action-btn"
                style={{ fontSize: "12px", padding: "6px 10px" }}
                onClick={() => {
                  setEmail("Sarah Johnson");
                  setPassword("demo123");
                }}
              >
                👤 Sarah Johnson (CAND-001)
              </button>
              <button
                type="button"
                className="secondary-action-btn"
                style={{ fontSize: "12px", padding: "6px 10px" }}
                onClick={() => {
                  setEmail("Alex Turner");
                  setPassword("demo123");
                }}
              >
                👤 Alex Turner (CAND-002)
              </button>
              <button
                type="button"
                className="secondary-action-btn"
                style={{ fontSize: "12px", padding: "6px 10px" }}
                onClick={() => {
                  setEmail("New Candidate");
                  setPassword("demo123");
                }}
              >
                ✨ New Candidate (0 Progress)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">EMAIL OR CANDIDATE NAME</label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="Enter candidate name (e.g. Sarah Johnson) or email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="login-submit primary-action-btn"
            disabled={submitting || !isApiConfigured}
          >
            <span>{submitting ? "Signing in..." : "Sign in"}</span>
            <span>→</span>
          </button>

          <p className="login-footer-text">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-link">
              Create one
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
