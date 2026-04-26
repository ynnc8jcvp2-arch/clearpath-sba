/**
 * OAuth Callback Handler
 *
 * Handles the redirect from Google OAuth.
 * Supabase automatically exchanges the auth code for a session.
 * This page just shows a loading state and redirects to the app.
 *
 * Route: /auth/callback
 * Called by: Google OAuth redirect after user approves sign-in
 */

import React, { useEffect } from 'react';
import { useAuth } from './useAuth';

export function OAuthCallback() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Once authentication is complete, redirect to home
    if (!loading && isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] to-[#1b3a6b] flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto" />
        <p className="text-white text-lg font-medium">Completing sign-in...</p>
        <p className="text-slate-300 text-sm">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
