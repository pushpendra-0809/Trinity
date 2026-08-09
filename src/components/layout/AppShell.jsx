import { useCallback, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCandidateProfile } from "../../services/interviewService";
import "./AppShell.css";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await getCandidateProfile(user?.name || user?.id || "Sarah Johnson");
      setProfileData(data);
    } catch (err) {
      setProfileError(err.message || "Failed to load candidate profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const handleOpenProfile = (e) => {
    if (e) e.preventDefault();
    setIsProfileOpen(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const member = profileData?.member || {};
  const signals = profileData?.signals || {};
  const missions = profileData?.missions || [];
  const isRegistered = profileData?.is_registered ?? true;

  return (
    <div className="app-shell">
      <div className="app-glow" />
      <div className="app-glow-secondary" />

      <header className="app-shell-header">
        <NavLink to="/dashboard" className="app-shell-logo">
          TRINITY
        </NavLink>

        <nav className="app-shell-nav" aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "active" : undefined)}>
            History
          </NavLink>
          <button
            type="button"
            className="app-shell-nav-btn"
            onClick={handleOpenProfile}
          >
            Profile
          </button>
        </nav>

        <div className="app-shell-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="app-shell-user-btn"
            onClick={handleOpenProfile}
            title="Click to view Candidate Profile"
          >
            👤 {user?.name || "Candidate"}
          </button>
          <button
            type="button"
            className="secondary-action-btn app-shell-logout-btn"
            onClick={handleLogout}
            style={{ fontSize: "13px", padding: "6px 12px", border: "1px solid rgba(255, 255, 255, 0.15)" }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="app-shell-main">{children}</main>

      {/* Candidate Profile Modal Popup */}
      {isProfileOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsProfileOpen(false)}>
          <div className="profile-modal-card content-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div className="profile-modal-title-box">
                <span className={`profile-status-badge ${isRegistered ? "registered" : "unregistered"}`}>
                  {profileData?.status_label || (isRegistered ? "REGISTERED CANDIDATE" : "NEW CANDIDATE")}
                </span>
                <h2>{member.name || user?.name || "Candidate Profile"}</h2>
                <p className="profile-cohort-sub">{member.cohort || "TRINITY AI Cohort"}</p>
              </div>
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => setIsProfileOpen(false)}
              >
                ✕
              </button>
            </div>

            {profileLoading ? (
              <div className="profile-loading-state">
                <p>Loading candidate profile from candidates.json...</p>
              </div>
            ) : profileError ? (
              <div className="profile-error-state">
                <p>{profileError}</p>
                <button type="button" className="secondary-action-btn" onClick={fetchProfile}>
                  Retry
                </button>
              </div>
            ) : (
              <div className="profile-modal-body">
                {/* Candidate Info Grid */}
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-info-label">Candidate ID</span>
                    <span className="profile-info-val">{member.id || "CAND-001"}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Job Track / Role</span>
                    <span className="profile-info-val">{member.jobRole || "AI Engineer"}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Experience</span>
                    <span className="profile-info-val">{member.yearsExperience ?? 0} Years</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Education</span>
                    <span className="profile-info-val">{member.education || "BS Computer Science"}</span>
                  </div>
                </div>

                {isRegistered ? (
                  <>
                    {/* Learning Signals Stats */}
                    <div className="profile-signals-row">
                      <div className="signal-box">
                        <span className="signal-box-val">{signals.commitDays || 0}</span>
                        <span className="signal-box-lbl">Commit Days</span>
                      </div>
                      <div className="signal-box">
                        <span className="signal-box-val">{signals.missionsCompleted || 0}</span>
                        <span className="signal-box-lbl">Missions Completed</span>
                      </div>
                      <div className="signal-box">
                        <span className="signal-box-val">{signals.missionsFirstTry || 0}</span>
                        <span className="signal-box-lbl">First-Try Missions</span>
                      </div>
                    </div>

                    {/* Missions Breakdown List */}
                    {missions.length > 0 && (
                      <div className="profile-missions-section">
                        <h3>Curriculum Missions ({missions.length})</h3>
                        <div className="profile-missions-list">
                          {missions.map((m, idx) => (
                            <div key={idx} className="mission-list-item">
                              <div className="mission-item-left">
                                <span className={`mission-status-dot ${m.skipped ? "skipped" : m.passed ? "passed" : "failed"}`}>
                                  {m.skipped ? "↷" : m.passed ? "✓" : "✗"}
                                </span>
                                <span className="mission-title-text">
                                  Day {m.day}: {m.title}
                                </span>
                              </div>
                              <span className="mission-attempts">
                                {m.skipped ? "Skipped" : `${m.attempts || 1} Attempt${(m.attempts || 1) === 1 ? "" : "s"}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="profile-unregistered-note">
                    <p>ℹ️ {profileData?.note || "First-time candidate profile. Complete your first technical assessment to build your engineering credentials."}</p>
                  </div>
                )}
              </div>
            )}

            <div className="profile-modal-footer">
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => setIsProfileOpen(false)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
