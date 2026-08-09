import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LockdownConsentModal,
  LockdownFullscreenErrorModal,
} from "../components/common/LockdownModal";
import { startNewInterviewForCandidate } from "../services/interviewService";
import "../styles/shared.css";

// ─────────────────────────────────────────────────────────────────────────────
// NewInterviewPage — /interview/new
//
// Dashboard "Start New Test" path.
//
// This page NEVER asks for a candidate name. The candidate identity is fully
// determined from the active AuthContext user — which was set during login /
// initial candidate resolution.
//
// Flow:
//   Dashboard → /interview/new → create fresh session → /interview/:id
// ─────────────────────────────────────────────────────────────────────────────

export default function NewInterviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lockdown flow state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showFullscreenError, setShowFullscreenError] = useState(false);

  // UI state
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Double-click / double-mount guard (Section 21)
  const creatingRef = useRef(false);

  // Resolved new session id (stored before lockdown so we can navigate after)
  const pendingSessionIdRef = useRef(null);

  // ── Guard: no user → redirect to home (Sections 8, 19) ───────────────────
  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // ── Auto-trigger session creation on mount ────────────────────────────────
  useEffect(() => {
    if (!user) return;
    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // createSession — calls backend to create a fresh interview session.
  // Backend is authoritative for candidate identity (Section 18).
  // ─────────────────────────────────────────────────────────────────────────
  async function createSession() {
    // Double-click / double-mount guard (Section 21)
    if (creatingRef.current) return;
    creatingRef.current = true;

    setCreating(true);
    setError(null);

    try {
      const result = await startNewInterviewForCandidate({
        id: user.id,
        name: user.name,
        candidate_type: user.candidate_type,
        jobRole: user.jobRole || "AI Engineer",
      });

      const interviewId = result?.id ?? result?.interviewId ?? result?.session_id;
      if (!interviewId) {
        throw new Error("No interview ID returned from server.");
      }

      pendingSessionIdRef.current = interviewId;

      /* LOCKDOWN BROWSER TEMPORARILY DISABLED FOR TESTING */
      // setShowConsentModal(true);
      navigate(`/interview/${interviewId}`, { replace: true });
    } catch (err) {
      // Error: remain on this page — never route to registration (Section 22)
      setError(err.message || "Unable to start a new interview. Please try again.");
      creatingRef.current = false; // allow retry
    } finally {
      setCreating(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lockdown modal handlers (mirrors InterviewSetupPage exactly)
  // ─────────────────────────────────────────────────────────────────────────
  const handleCancelConsent = () => {
    setShowConsentModal(false);
    creatingRef.current = false;
    navigate("/dashboard", { replace: true });
  };

  const requestFullscreenAndStart = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      setShowFullscreenError(false);
      if (pendingSessionIdRef.current) {
        navigate(`/interview/${pendingSessionIdRef.current}`, { replace: true });
      }
    } catch (err) {
      console.warn("Fullscreen permission rejected:", err);
      setShowFullscreenError(true);
    }
  };

  const handleConfirmConsent = async () => {
    setShowConsentModal(false);
    await requestFullscreenAndStart();
  };

  const handleCancelFullscreenError = () => {
    setShowFullscreenError(false);
    navigate("/dashboard", { replace: true });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          background: "var(--surface-bg, #0a0f1e)",
          padding: "32px",
        }}
      >
        {error ? (
          /* ── Error state (Section 22) ──────────────────────────────────── */
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            >
              ⚠️
            </div>

            <div>
              <h2
                style={{
                  color: "#f1f5f9",
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Could not start interview
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                {error}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                id="new-interview-retry-btn"
                type="button"
                className="primary-action-btn"
                onClick={createSession}
                disabled={creating}
                style={{ minWidth: "140px" }}
              >
                {creating ? "Retrying…" : "Try Again"}
              </button>
              <button
                id="new-interview-back-btn"
                type="button"
                className="secondary-action-btn"
                onClick={() => navigate("/dashboard", { replace: true })}
                style={{ minWidth: "180px" }}
              >
                ← Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ── Loading / creating state ──────────────────────────────────── */
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Animated spinner */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                border: "3px solid rgba(99, 102, 241, 0.15)",
                borderTop: "3px solid #6366f1",
                animation: "spin 0.9s linear infinite",
              }}
            />

            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>

            <div>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  fontWeight: 600,
                }}
              >
                TRINITY Assessment Engine
              </p>
              <h2
                style={{
                  color: "#f1f5f9",
                  fontSize: "22px",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                Preparing your interview{user?.name ? `, ${user.name.split(" ")[0]}` : ""}…
              </h2>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  lineHeight: "1.7",
                }}
              >
                Initialising adaptive engine&nbsp;·&nbsp;Setting difficulty baseline&nbsp;·&nbsp;Loading question pool
              </p>
            </div>
          </div>
        )}
      </div>

      <LockdownConsentModal
        isOpen={showConsentModal}
        onConfirm={handleConfirmConsent}
        onCancel={handleCancelConsent}
      />

      <LockdownFullscreenErrorModal
        isOpen={showFullscreenError}
        onRetry={requestFullscreenAndStart}
        onCancel={handleCancelFullscreenError}
      />
    </>
  );
}
