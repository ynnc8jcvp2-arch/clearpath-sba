import React, { useState, useEffect } from 'react';
import App from './App';
import { OAuthCallback } from './auth/callback';
import { SuretyApplicationForm } from './domains/surety/components/SuretyApplicationForm';
import { SuretyCalculatorDemo } from './domains/surety/components/SuretyCalculatorDemo';
import { initializeSuretyDB } from './domains/surety/db/suretyDatabase';
import { Menu, X } from 'lucide-react';

/**
 * Main Application Router
 * Routes between SBA Loan Processing and Surety Bond Underwriting
 */
export default function AppRouter() {
  const [currentPage, setCurrentPage] = useState('sba');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Initialize Supabase on mount
  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Dynamically import Supabase only if it's configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseClient = createClient(supabaseUrl, supabaseKey);
          initializeSuretyDB(supabaseClient);
          setSupabaseReady(true);
        } else {
          console.warn('Supabase not configured. Database features will be disabled.');
          setSupabaseReady(false);
        }
      } catch (error) {
        console.warn('Supabase initialization failed:', error);
        setSupabaseReady(false);
      }
    };

    initializeSupabase();
  }, []);

  // Handle OAuth callback route
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/auth/callback') {
      setCurrentPage('oauth-callback');
    }
  }, []);

  return (
    <RouterContent
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      supabaseReady={supabaseReady}
    />
  );
}

function RouterContent({
  currentPage,
  setCurrentPage,
  mobileMenuOpen,
  setMobileMenuOpen,
  supabaseReady,
}) {
  return (
    <div className={currentPage === 'surety-demo' ? 'bg-slate-900' : 'bg-slate-50'}>
      {/* Page Content - App.jsx includes its own professional header */}
      <main className={currentPage === 'surety-demo' ? '' : 'min-h-screen'}>
        {currentPage === 'sba' && <App supabaseReady={supabaseReady} />}
        {currentPage === 'oauth-callback' && <OAuthCallback />}
        {currentPage === 'surety' && <SuretyApplicationForm />}
        {currentPage === 'surety-demo' && <SuretyCalculatorDemo />}
      </main>

      {/* Footer is rendered inside App.jsx — no duplicate here */}
    </div>
  );
}
