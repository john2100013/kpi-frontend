/**
 * Protected Route Component
 * 
 * HOC for protecting routes that require authentication.
 * To be migrated from App.tsx in Phase 3.
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  useEffect(() => {
    // TODO: Implement protected route logic
  }, [location.pathname, allowedRoles]);

  return <>{children}</>;
};

export default ProtectedRoute;
