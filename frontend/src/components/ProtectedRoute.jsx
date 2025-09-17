import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, allowedRoles }) {
  // Use Redux selector to get auth state
  const { user, token } = useSelector((state) => state.auth);

  // Check if user is authenticated (has token and valid user data)
  if (!token || !user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    const redirectPath = user.role === 'admin' ? '/admin' :
                        user.role === 'vendor' ? '/vendor' :
                        user.role === 'customer' ? '/customer' : '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}