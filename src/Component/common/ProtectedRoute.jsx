import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!token || !isAuthenticated) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but wrong role, redirect to appropriate dashboard
    const isCounselor = userRole?.toLowerCase() === 'counselor' || userRole?.toLowerCase() === 'counsellor';
    
    if (isCounselor) {
      return <Navigate to="/counselor-dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
