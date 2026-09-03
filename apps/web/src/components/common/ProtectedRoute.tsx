import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  userEmail: string | null;
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ userEmail, children }) => {
  if (!userEmail) {
    return <Navigate to="/" replace />;
  }

  return children;
};
