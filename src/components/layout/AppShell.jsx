import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AppShell.css";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

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
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Profile
          </NavLink>
        </nav>

        <div className="app-shell-actions">
          {user?.name && <span className="app-shell-user">{user.name}</span>}
          <button type="button" className="app-shell-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-shell-main">{children}</main>
    </div>
  );
}
