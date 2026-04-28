/**
 * AuthProvider Component
 *
 * Wraps the entire app and manages authentication state.
 * - Initializes Supabase session on mount
 * - Listens for auth changes
 * - Refreshes tokens automatically
 * - Provides auth state to all children via context
 *
 * Usage:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create context for auth state
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Initialize Supabase client
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setError('Supabase configuration missing');
      setLoading(false);
      return;
    }

    const client = createClient(supabaseUrl, supabaseKey);
    setSupabaseClient(client);
  }, []);

  // Initialize auth session on mount
  useEffect(() => {
    if (!supabaseClient) return;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
          console.error('Auth initialization error:', sessionError);
          setError(sessionError.message);
        }

        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (event === 'SIGNED_OUT') {
          // Clear any local state on sign out
          setUser(null);
          setSession(null);
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token was automatically refreshed
          setSession(newSession);
        }
      }
    );

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // Verify Turnstile CAPTCHA token with backend
  const verifyCaptchaToken = useCallback(async (token) => {
    try {
      const response = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'CAPTCHA verification failed');
      }

      return true;
    } catch (err) {
      console.error('CAPTCHA verification error:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async (captchaToken) => {
    if (!supabaseClient) {
      setError('Supabase client not initialized');
      return;
    }

    try {
      setError(null);

      // Verify CAPTCHA token first
      if (captchaToken) {
        const isCaptchaValid = await verifyCaptchaToken(captchaToken);
        if (!isCaptchaValid) {
          return;
        }
      }

      const { error: signInError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [supabaseClient, verifyCaptchaToken]);

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabaseClient) return;

    try {
      setError(null);
      const { error: signOutError } = await supabaseClient.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [supabaseClient]);

  // Get user role (placeholder for Phase 1)
  const getUserRole = useCallback(async () => {
    if (!user || !supabaseClient) return null;

    try {
      // Phase 1 TODO: Query user_roles table
      // For now, return placeholder
      return 'underwriter'; // or 'admin', 'viewer'
    } catch (err) {
      console.error('Failed to fetch user role:', err);
      return null;
    }
  }, [user, supabaseClient]);

  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user && !!session,
    signInWithGoogle,
    signOut,
    getUserRole,
    supabaseClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
