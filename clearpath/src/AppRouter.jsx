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

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 border-t border-slate-700 mt-16">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">ClearPath</h3>
              <p className="text-sm">
                AI-powered financial underwriting for SBA loans and surety bonds.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Products</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setCurrentPage('sba')}
                    className="hover:text-white transition-colors"
                  >
                    SBA Loan Processing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentPage('surety')}
                    className="hover:text-white transition-colors"
                  >
                    Surety Bond Underwriting
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentPage('surety-demo')}
                    className="hover:text-white transition-colors"
                  >
                    Surety Calculator Demo
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Status</h4>
              <div className="text-sm">
                {supabaseReady ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Database Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Demo Mode (No DB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2026 ClearPath. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
