import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InterviewSetup from "../components/InterviewSetup";
import { getInterviewConfiguration, startInterview } from "../services/interviewService";
import "../styles/shared.css";

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [configOptions, setConfigOptions] = useState(null);

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

  const handleStart = async (config) => {
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
        onStart={handleStart}
        isSubmitting={submitting}
        configOptions={configOptions}
      />
    </>
  );
}
