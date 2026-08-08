/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";
import { ApiError, isApiConfigured, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

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
      if (!isApiConfigured()) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            setAuthToken(null);
            setUser(null);
          } else {
            setUser(null);
          }
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
    setUser(data.user ?? data);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    const data = await authService.register(userData);
    setUser(data.user ?? data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
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
