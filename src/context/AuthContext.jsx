/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";
import { ApiError, isApiConfigured, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

// ─── Helpers to read/write the persisted user identity ────────────────────────
// We persist the full candidate object (id, name, candidate_type, jobRole) in
// localStorage under "trinity_user". This is the single source of truth for
// identity across page refreshes. The /auth/me endpoint is only used as a
// fallback when no local identity exists.

function readStoredUser() {
  try {
    const raw = localStorage.getItem("trinity_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Must have at least an id and name to be valid
    if (parsed && parsed.id && parsed.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStoredUser(userObj) {
  try {
    if (userObj) {
      localStorage.setItem("trinity_user", JSON.stringify(userObj));
    } else {
      localStorage.removeItem("trinity_user");
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    if (!isApiConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setAuthToken(null);
        setUser(null);
      } else if (err instanceof ApiError && err.status === 0) {
        setUser(null);
      } else {
        setError(err.message);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initUser() {
      // ── STEP 1: Try localStorage first ──────────────────────────────────
      // This is the authoritative source for candidate identity after login.
      // Reading from localStorage avoids the /auth/me stub overwriting the
      // real candidate identity (CAND-001, CAND-002, etc.) with DEMO_USER.
      const storedUser = readStoredUser();
      if (storedUser) {
        if (isMounted) {
          setUser(storedUser);
          setLoading(false);
        }
        return;
      }

      // ── STEP 2: No local identity — try the API ──────────────────────────
      if (!isApiConfigured()) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        // Only accept the API response if it is a real candidate identity
        // (not the hardcoded DEMO_USER stub: id=="demo-user").
        if (currentUser && currentUser.id && currentUser.id !== "demo-user") {
          if (isMounted) {
            setUser(currentUser);
            writeStoredUser(currentUser);
            setLoading(false);
          }
        } else {
          // /auth/me returned the demo stub — treat as unauthenticated
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            setAuthToken(null);
          }
          setUser(null);
          setLoading(false);
        }
      }
    }

    initUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    const data = await authService.login(credentials);
    const userObj = data.user ?? data;
    setUser(userObj);
    writeStoredUser(userObj);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    const data = await authService.register(userData);
    const userObj = data.user ?? data;
    setUser(userObj);
    writeStoredUser(userObj);
    return data;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      writeStoredUser(null); // clears trinity_user from localStorage
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      error,
      isAuthenticated: Boolean(user),
      isApiConfigured: isApiConfigured(),
      login,
      register,
      logout,
      refreshUser,
      setError,
    }),
    [user, loading, error, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
