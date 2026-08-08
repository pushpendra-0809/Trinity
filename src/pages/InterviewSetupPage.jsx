import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleStartInterview = async (config) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await startInterview(config);
      const interviewId = result?.id ?? result?.interviewId;

      if (!interviewId) {
        throw new Error("Interview could not be started. No interview ID was returned.");
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
