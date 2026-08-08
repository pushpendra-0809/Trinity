import React, { useState } from "react";
import "./InterviewSetup.css";

function InterviewSetup({ onBack, onStart }) {
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState("");
  const [interviewType, setInterviewType] = useState("Technical");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!candidateName.trim() || !jobRole.trim() || !experience) {
      alert("Please fill all required fields.");
      return;
    }

    onStart({
      candidateName,
      jobRole,
      experience,
      interviewType,
    });
  };

  return (
    <div className="setup-page">

      {/* Background */}
      <div className="setup-glow"></div>
      <div className="setup-glow-secondary"></div>

      {/* Header */}
      <header className="setup-header">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          <span>←</span>
          Back
        </button>

        <div className="setup-logo">
          TRINITY
        </div>

        <div className="setup-step">
          STEP 01 <span>/</span> 02
        </div>
      </header>

      {/* Main */}
      <main className="setup-main">

        <div className="setup-badge">
          INTERVIEW SETUP
        </div>

        <h1>
          Let's prepare your
          <span> interview.</span>
        </h1>

        <p className="setup-description">
          Tell Trinity a little about the candidate and the role.
          We'll use this information to create a focused interview.
        </p>

        {/* Form Card */}
        <form
          className="setup-card"
          onSubmit={handleSubmit}
        >

          {/* Candidate */}
          <div className="form-group">
            <label htmlFor="candidateName">
              CANDIDATE NAME
            </label>

            <input
              id="candidateName"
              type="text"
              placeholder="Enter candidate name"
              value={candidateName}
              onChange={(e) =>
                setCandidateName(e.target.value)
              }
            />
          </div>

          {/* Job Role */}
          <div className="form-group">
            <label htmlFor="jobRole">
              JOB ROLE
            </label>

            <input
              id="jobRole"
              type="text"
              placeholder="e.g. Software Engineer"
              value={jobRole}
              onChange={(e) =>
                setJobRole(e.target.value)
              }
            />
          </div>

          {/* Experience */}
          <div className="form-group">
            <label htmlFor="experience">
              EXPERIENCE LEVEL
            </label>

            <select
              id="experience"
              value={experience}
              onChange={(e) =>
                setExperience(e.target.value)
              }
            >
              <option value="">
                Select experience level
              </option>

              <option value="Fresher">
                Fresher
              </option>

              <option value="0-2 years">
                0–2 years
              </option>

              <option value="2-5 years">
                2–5 years
              </option>

              <option value="5+ years">
                5+ years
              </option>
            </select>
          </div>

          {/* Interview Type */}
          <div className="form-group">
            <label>
              INTERVIEW TYPE
            </label>

            <div className="interview-types">

              {/* Technical */}
              <button
                type="button"
                className={
                  interviewType === "Technical"
                    ? "type-option active"
                    : "type-option"
                }
                onClick={() =>
                  setInterviewType("Technical")
                }
              >
                <span className="type-icon">
                  ⌘
                </span>

                <span>
                  <strong>Technical</strong>
                  <small>
                    Skills & problem solving
                  </small>
                </span>
              </button>

              {/* Behavioral */}
              <button
                type="button"
                className={
                  interviewType === "Behavioral"
                    ? "type-option active"
                    : "type-option"
                }
                onClick={() =>
                  setInterviewType("Behavioral")
                }
              >
                <span className="type-icon">
                  ◈
                </span>

                <span>
                  <strong>Behavioral</strong>
                  <small>
                    Communication & culture
                  </small>
                </span>
              </button>

              {/* Mixed */}
              <button
                type="button"
                className={
                  interviewType === "Mixed"
                    ? "type-option active"
                    : "type-option"
                }
                onClick={() =>
                  setInterviewType("Mixed")
                }
              >
                <span className="type-icon">
                  ✦
                </span>

                <span>
                  <strong>Mixed</strong>
                  <small>
                    Technical + behavioral
                  </small>
                </span>
              </button>

            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="start-setup-button"
          >
            <span>Continue to Interview</span>
            <span>→</span>
          </button>

        </form>

        <div className="setup-footer">
          <span className="footer-dot"></span>
          POWERED BY TRINITY INTERVIEW INTELLIGENCE
        </div>

      </main>

    </div>
  );
}

export default InterviewSetup;