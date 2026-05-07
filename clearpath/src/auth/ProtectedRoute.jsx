/**
 * ProtectedRoute Component
 *
 * Wrapper component for routes that require authentication.
 * Shows loading state while checking auth, redirects to login if not authenticated.
 * Supports role-based access control (Phase 1 TODO).
 *
 * Usage:
 * <ProtectedRoute requiredRole="underwriter">
 *   <MyAuthenticatedComponent />
 * </ProtectedRoute>
 */

import React from 'react';
import { useAuth } from './useAuth';
import { LoginPage } from './LoginPage';

// Role hierarchy: admin > underwriter > viewer
const ROLE_HIERARCHY = { admin: 3, underwriter: 2, viewer: 1 };

function hasRequiredRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, userRole } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a2540] to-[#1b3a6b] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Role-based access control
  if (requiredRole && !hasRequiredRole(userRole, requiredRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a2540] to-[#1b3a6b] flex items-center justify-center">
        <div className="space-y-4 text-center max-w-md mx-auto p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-white text-2xl font-bold">Access Denied</h2>
          <p className="text-blue-200">
            You need <strong>{requiredRole}</strong> access to view this page.
            Your current role is <strong>{userRole || 'viewer'}</strong>.
          </p>
          <p className="text-blue-300 text-sm">
            Contact your administrator to request elevated permissions.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
