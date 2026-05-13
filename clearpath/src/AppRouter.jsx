import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { initializeSuretyDB } from './domains/surety/db/suretyDatabase';
import { supabase } from './shared/utils/supabaseClient';

const App = lazy(() => import('./App'));
const OAuthCallback = lazy(() => import('./auth/callback').then((module) => ({ default: module.OAuthCallback })));
const SuretyApplicationForm = lazy(() => import('./domains/surety/components/SuretyApplicationForm').then((module) => ({ default: module.SuretyApplicationForm })));
const SuretyCalculatorDemo = lazy(() => import('./domains/surety/components/SuretyCalculatorDemo').then((module) => ({ default: module.SuretyCalculatorDemo })));

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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          initializeSuretyDB(supabase);
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
    const normalizedPath = path.replace(/\/+$/, '') || '/';

    if (normalizedPath === '/auth/callback') {
      setCurrentPage('oauth-callback');
    }
  }, []);

  return (
    <AuthProvider>
      <RouterContent
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        supabaseReady={supabaseReady}
      />
    </AuthProvider>
  );
}

function RouterContent({
  currentPage,
  setCurrentPage,
  mobileMenuOpen,
  setMobileMenuOpen,
  supabaseReady,
}) {
  const fallback = (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-700">
      Loading BondSBA workspace…
    </div>
  );

  return (
    <div className={currentPage === 'surety-demo' ? 'bg-slate-900' : 'bg-slate-50'}>
      {/* Page Content - App.jsx includes its own professional header */}
      <main className={currentPage === 'surety-demo' ? '' : 'min-h-screen'}>
        <Suspense fallback={fallback}>
          {currentPage === 'sba' && <App supabaseReady={supabaseReady} />}
          {currentPage === 'oauth-callback' && <OAuthCallback />}
          {currentPage === 'surety' && <SuretyApplicationForm />}
          {currentPage === 'surety-demo' && <SuretyCalculatorDemo />}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 border-t border-slate-700 mt-16">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">BondSBA Terminal</h3>
              <p className="text-sm">
                Partner-focused workflow for SBA, bond, and business financing submissions.
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
                  <a href="mailto:contactbondsba@gmail.com" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="mailto:contactbondsba@gmail.com" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white transition-colors">
                    Terms
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
            <p>&copy; 2026 BondSBA Terminal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
