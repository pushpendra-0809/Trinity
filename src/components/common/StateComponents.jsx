import React from "react";
import "./StateComponents.css";

export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="state-container" role="status" aria-live="polite">
      <div className="state-spinner" aria-hidden="true" />
      <p className="state-message">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="state-container">
      <div className="state-icon" aria-hidden="true">
        ◌
      </div>
      <h3 className="state-title">{title}</h3>
      {description && <p className="state-message">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-container state-error" role="alert">
      <div className="state-icon" aria-hidden="true">
        !
      </div>
      <h3 className="state-title">Something went wrong</h3>
      <p className="state-message">{message}</p>
      {onRetry && (
        <button type="button" className="secondary-action-btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
