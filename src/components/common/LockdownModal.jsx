import "./LockdownModal.css";

export function LockdownConsentModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="lockdown-overlay">
      <div className="lockdown-modal">
        <div className="lockdown-badge lockdown-badge-warning">
          PROCTORED ENVIRONMENT
        </div>

        <h2 className="lockdown-title">
          ⚠️ Test Environment Notice
        </h2>

        <div className="lockdown-notice-highlight">
          Your test will enter Browser Lockdown Mode.
        </div>

        <div className="lockdown-body">
          <p>
            Once the test begins, switching away from this test page or exiting
            fullscreen even once will automatically terminate your test.
            Please stay on this page until you complete the test.
          </p>
          <p className="lockdown-agreement">
            By continuing, you agree to the browser monitoring rules for this test.
          </p>
        </div>

        <div className="lockdown-actions">
          <button
            type="button"
            className="lockdown-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="lockdown-btn-continue"
            onClick={onConfirm}
          >
            I Understand & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export function LockdownFullscreenErrorModal({ isOpen, onRetry, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="lockdown-overlay">
      <div className="lockdown-modal">
        <div className="lockdown-badge lockdown-badge-warning">
          PERMISSION REQUIRED
        </div>

        <h2 className="lockdown-title">
          ⚠️ Fullscreen Required
        </h2>

        <div className="lockdown-body">
          <p>
            Fullscreen permission is required to start this test.
            Please allow fullscreen access and try again.
          </p>
        </div>

        <div className="lockdown-actions">
          <button
            type="button"
            className="lockdown-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="lockdown-btn-continue"
            onClick={onRetry}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export function LockdownTerminationModal({ isOpen, reason, onViewResult }) {
  if (!isOpen) return null;

  const isFullscreenReason = reason === "fullscreen";
  const message = isFullscreenReason
    ? "You exited fullscreen mode while the test was active. The test has been closed."
    : "Your test has been closed because you switched away from the test page while lockdown mode was active.";

  return (
    <div className="lockdown-overlay">
      <div className="lockdown-modal lockdown-modal-terminated">
        <div className="lockdown-badge lockdown-badge-error">
          LOCKDOWN VIOLATION DETECTED
        </div>

        <h2 className="lockdown-title">
          🚫 Test Terminated
        </h2>

        <div className="lockdown-notice-highlight lockdown-notice-terminated">
          {message}
        </div>

        <div className="lockdown-body">
          <p>
            This session has been terminated in accordance with the proctored test environment rules.
            Your responses up to this point have been saved.
          </p>
        </div>

        <div className="lockdown-actions">
          <button
            type="button"
            className="lockdown-btn-continue lockdown-btn-terminate"
            onClick={onViewResult}
          >
            View Result & Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}
