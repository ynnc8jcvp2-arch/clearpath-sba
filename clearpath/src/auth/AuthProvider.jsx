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
  const [userRole, setUserRole] = useState(null);

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
          setUser(null);
          setSession(null);
          setUserRole(null);
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Fetch role on sign in
          try {
            const { data } = await supabaseClient
              .from('user_roles')
              .select('role')
              .eq('user_id', newSession.user.id)
              .single();
            setUserRole(data?.role || 'viewer');
          } catch {
            setUserRole('viewer');
          }
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(newSession);
        }
      }
    );

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // Verify reCAPTCHA token with backend
  const verifyCaptchaToken = useCallback(async (token) => {
    try {
      const response = await fetch('/api/v1/auth/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, action: 'login' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'reCAPTCHA verification failed');
      }

      return true;
    } catch (err) {
      console.error('reCAPTCHA verification error:', err);
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

  // Get user role — queries user_roles table in Supabase
  const getUserRole = useCallback(async () => {
    if (!user || !supabaseClient) return null;

    try {
      const { data, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        // If no row found, default to viewer (least privilege)
        if (roleError.code === 'PGRST116') return 'viewer';
        console.error('Failed to fetch user role:', roleError);
        return 'viewer';
      }

      return data?.role || 'viewer';
    } catch (err) {
      console.error('Failed to fetch user role:', err);
      return 'viewer';
    }
  }, [user, supabaseClient]);

  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user && !!session,
    userRole,
    signInWithGoogle,
    signOut,
    getUserRole,
    supabaseClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
