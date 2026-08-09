import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InterviewSetup from "../components/InterviewSetup";
import {
  LockdownConsentModal,
  LockdownFullscreenErrorModal,
} from "../components/common/LockdownModal";
import { getInterviewConfiguration, startInterview } from "../services/interviewService";
import "../styles/shared.css";

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [configOptions, setConfigOptions] = useState(null);

  const [pendingConfig, setPendingConfig] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showFullscreenError, setShowFullscreenError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const data = await getInterviewConfiguration();
        if (!cancelled) {
          setConfigOptions(data);
        }
      } catch {
        if (!cancelled) {
          setConfigOptions(null);
        }
      }
    }

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const { setUser, user } = useAuth();

  const handleStartInterview = async (config) => {
    setSubmitting(true);
    setError(null);

    try {
      // Section 24 identity invariant: if a candidate is already resolved (from
      // login/register), pass their candidate_id to startInterview so the backend
      // reuses the same id instead of generating a second different session_cand_*.
      const payload = {
        ...config,
        ...(user?.id ? { candidate_id: user.id } : {}),
      };

      const result = await startInterview(payload);
      const interviewId = result?.id ?? result?.interviewId;

      if (!interviewId) {
        throw new Error("Interview could not be started. No interview ID was returned.");
      }

      if (result?.candidate) {
        const userObj = {
          id: result.candidate.candidate_id || result.candidate.id,
          name: result.candidate.display_name || result.candidate.name || config.candidateName,
          candidate_type: result.candidate.candidate_type || "new",
          jobRole: config.jobRole,
        };
        if (setUser) setUser(userObj);
        try {
          localStorage.setItem("trinity_user", JSON.stringify(userObj));
        } catch {
          // ignore
        }
      }

      navigate(`/interview/${interviewId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialFormSubmit = (config) => {
    setPendingConfig(config);
    setShowConsentModal(true);
  };

  const handleCancelConsent = () => {
    setShowConsentModal(false);
    setPendingConfig(null);
  };

  const requestFullscreenAndStart = async (configToStart) => {
    const targetConfig = configToStart || pendingConfig;
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
      if (targetConfig) {
        await handleStartInterview(targetConfig);
      }
    } catch (err) {
      console.warn("Fullscreen permission rejected or failed:", err);
      setShowFullscreenError(true);
    }
  };

  const handleConfirmConsent = async () => {
    setShowConsentModal(false);
    await requestFullscreenAndStart(pendingConfig);
  };

  const handleCancelFullscreenError = () => {
    setShowFullscreenError(false);
    setPendingConfig(null);
  };

  return (
    <>
      {error && (
        <div
          className="form-error-banner"
          style={{
            position: "fixed",
            top: "90px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
          }}
        >
          {error}
        </div>
      )}

      <InterviewSetup
        onBack={() => navigate("/dashboard")}
        onStart={handleInitialFormSubmit}
        isSubmitting={submitting}
        configOptions={configOptions}
      />

      <LockdownConsentModal
        isOpen={showConsentModal}
        onConfirm={handleConfirmConsent}
        onCancel={handleCancelConsent}
      />

      <LockdownFullscreenErrorModal
        isOpen={showFullscreenError}
        onRetry={() => requestFullscreenAndStart(pendingConfig)}
        onCancel={handleCancelFullscreenError}
      />
    </>
  );
}
