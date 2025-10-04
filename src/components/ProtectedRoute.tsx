import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthentication } from '../context/AuthenticationContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'agent';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user: authUser } = useAuthentication();

  // Not authenticated at all
  if (!authUser.user && !authUser.agent) {
    return <Navigate to="/" replace />;
  }

  // Check role if specified
  if (requiredRole) {
    if (requiredRole === 'user' && !authUser.user) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'agent' && !authUser.agent) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
