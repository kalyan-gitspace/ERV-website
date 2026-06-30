import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

/**
 * AuthGuard prevents logged-in users from accessing authentication pages (e.g. login).
 * Redirects them directly to the admin dashboard.
 */
export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Checking active sessions..." />;
  }

  if (isAuthenticated) {
    // If redirected to login, send them to where they came from or default dashboard
    const from = location.state?.from?.pathname || '/admin';
    return <Navigate to={from} replace />;
  }

  return children;
}
