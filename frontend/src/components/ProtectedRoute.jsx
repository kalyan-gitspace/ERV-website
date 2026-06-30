import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

/**
 * Route protector that requires authorization and specific roles if requested.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the original path they attempted to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user?.roleName);
    if (!hasRole) {
      // User is authenticated but lacks required role - redirect to 403 Forbidden
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
