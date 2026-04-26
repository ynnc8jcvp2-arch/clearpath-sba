/**
 * LoginPage Component
 *
 * Landing page for unauthenticated users.
 * Displays "Sign in with Google" button with company branding.
 * Handles authentication flow entry point.
 *
 * Usage:
 * <LoginPage />
 */

import React, { useState } from 'react';
import { useAuth } from './useAuth';

export function LoginPage() {
  const { signInWithGoogle, error, loading } = useAuth();
  const [localError, setLocalError] = useState(null);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] to-[#1b3a6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">ClearPath</h1>
          <p className="text-slate-300 text-lg">Professional Lending Platform</p>
          <p className="text-slate-400 text-sm mt-2">Powered by Trisura</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 space-y-6">
          {/* Product Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Welcome</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              ClearPath is a professional platform for SBA loan analysis and commercial surety underwriting.
              Sign in to access document parsing, loan calculations, and term sheet generation.
            </p>
          </div>

          {/* Error Display */}
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">
                {error || localError}
              </p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-[#1b3a6b] hover:bg-[#0f2442] text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Help Text */}
          <p className="text-xs text-slate-500 text-center">
            Work email required. Contact your administrator if you don't have access.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-slate-400 text-xs">
            🔒 Secure login with Google and Supabase
          </p>
          <p className="text-slate-400 text-xs">
            Questions? Contact <a href="mailto:support@clearpath.io" className="text-sky-300 hover:underline">support@clearpath.io</a>
          </p>
        </div>
      </div>
    </div>
  );
}
