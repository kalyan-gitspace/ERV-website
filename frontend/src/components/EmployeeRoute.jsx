import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEmployeeAuth } from '../context/EmployeeAuthContext';
import { LoadingScreen } from './LoadingScreen';
export default function EmployeeRoute({ children }) { const { isAuthenticated, loading } = useEmployeeAuth(); if (loading) return <LoadingScreen message="Authenticating employee session..." />; return isAuthenticated ? children : <Navigate to="/employeelogin" replace />; }