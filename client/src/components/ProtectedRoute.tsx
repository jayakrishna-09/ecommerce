import React, { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);

  // Check if user is authenticated
  if (!token || !user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'vendor'
          ? '/vendor'
          : user.role === 'customer'
            ? '/customer'
            : '/login';
    // Prevent redundant navigation
    if (window.location.pathname !== redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};
export default ProtectedRoute;
