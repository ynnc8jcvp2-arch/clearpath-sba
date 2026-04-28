/**
 * AuthModal Component
 *
 * Modal displaying "Sign In" and "Create Account" tabs.
 * Both paths use Google OAuth for authentication.
 * Appears on login page to give users a choice between paths.
 *
 * Usage:
 * <AuthModal isOpen={true} onClose={handleClose} />
 */

import React, { useState, useCallback } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useAuth } from './useAuth';

export function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signInWithGoogle } = useAuth();

  const handleGoogleClick = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if reCAPTCHA script is loaded
      if (!window.grecaptcha) {
        setError('reCAPTCHA is not configured. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      // Execute reCAPTCHA v3 (invisible)
      const recaptchaToken = await window.grecaptcha.execute(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY,
        { action: 'login' }
      );

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Proceed with Google OAuth
      await signInWithGoogle(recaptchaToken);
      // OAuth redirect happens, modal closes on callback
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  }, [signInWithGoogle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`pb-3 font-semibold text-sm transition-colors flex-1 ${
              mode === 'signin'
                ? 'text-slate-900 border-b-2 border-[#1B3A6B] -mb-[2px]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`pb-3 font-semibold text-sm transition-colors flex-1 ${
              mode === 'signup'
                ? 'text-slate-900 border-b-2 border-[#1B3A6B] -mb-[2px]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Join ClearPath'}
            </h2>
            <p className="text-sm text-slate-600">
              {mode === 'signin'
                ? 'Sign in to access your SBA and surety underwriting dashboard'
                : 'Create an account to start analyzing loans and bonds'}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleClick}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wide ${
              loading
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#0A2540]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                {mode === 'signin' ? 'Sign In' : 'Create Account'} with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-600">or</span>
            </div>
          </div>

          {/* Toggle Mode */}
          <p className="text-xs text-center text-slate-600">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-semibold text-[#1B3A6B] hover:underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-semibold text-[#1B3A6B] hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Help Text */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <p className="text-xs text-slate-500 text-center">
            Work email required. Contact your administrator if you don't have access.
          </p>
          <p className="text-xs text-slate-500 text-center">
            Questions?{' '}
            <a href="mailto:support@clearpath.io" className="text-[#1B3A6B] hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
