/**
 * LoginPage Component
 *
 * Landing page for unauthenticated users.
 * Displays "Sign in with Google" button with company branding.
 * Handles authentication flow entry point with Google reCAPTCHA v3.
 *
 * Usage:
 * <LoginPage />
 */

import React from 'react';
import { AuthModal } from './AuthModal';

export function LoginPage() {
  // AuthModal is always open on this page - it handles all auth flow
  // The modal takes care of reCAPTCHA, Google OAuth, and error handling

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] to-[#1b3a6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">ClearPath</h1>
          <p className="text-slate-300 text-lg">SBA 7(a) Loan & Surety Bond Underwriting</p>
        </div>

        {/* Auth Modal - Always visible on login page */}
        <AuthModal isOpen={true} onClose={() => {}} />

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-xs">
            Secure login with Google and Supabase
          </p>
          <p className="text-slate-400 text-xs">
            Questions? Contact <a href="mailto:support@clearpath.io" className="text-sky-300 hover:underline">support@clearpath.io</a>
          </p>
        </div>
      </div>
    </div>
  );
}
