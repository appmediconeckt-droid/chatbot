import { dashboardForRole, isProfessionalRole } from "../../authtication/authSession.js";
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, exactRoles = false }) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!token || !isAuthenticated) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  const normalizedAllowedRoles = allowedRoles?.map((role) => role.toLowerCase());

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole) && !(!exactRoles && isProfessionalRole(userRole) && normalizedAllowedRoles.some(isProfessionalRole))) {
    return <Navigate to={dashboardForRole(userRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
