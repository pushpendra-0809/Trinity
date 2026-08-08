import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/shared.css";
import "./Login.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isApiConfigured } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
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
        <Link to="/login" className="login-back">
          ← Back
        </Link>
        <div className="login-logo">TRINITY</div>
      </header>

      <main className="login-main">
        <div className="page-badge">CREATE ACCOUNT</div>

        <h1 className="page-title">
          Join
          <span className="login-title-accent"> Trinity.</span>
        </h1>

        <p className="page-description">
          Create an account to start mock interviews and track your progress over time.
        </p>

        {!isApiConfigured && (
          <div className="form-error-banner login-banner">
            Backend is not configured yet. Set <code>VITE_API_BASE_URL</code> to enable registration.
          </div>
        )}

        <form className="login-card content-card" onSubmit={handleSubmit}>
          {error && <div className="form-error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">FULL NAME</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="login-submit primary-action-btn"
            disabled={submitting || !isApiConfigured}
          >
            <span>{submitting ? "Creating account..." : "Create account"}</span>
            <span>→</span>
          </button>

          <p className="login-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="text-link">
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
