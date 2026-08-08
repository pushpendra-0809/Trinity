import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../common/StateComponents";

export default function ProtectedRoute() {
  const { isAuthenticated, loading, isApiConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Checking authentication..." />;
  }

  if (!isApiConfigured) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
