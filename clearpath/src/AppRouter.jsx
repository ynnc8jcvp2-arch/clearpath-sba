import React, { useState, useEffect } from 'react';
import App from './App';
import { SuretyApplicationForm } from './domains/surety/components/SuretyApplicationForm';
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="#" className="text-xl font-bold text-slate-900">
                ClearPath
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setCurrentPage('sba')}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  currentPage === 'sba'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SBA Loan Processing
              </button>
              <button
                onClick={() => setCurrentPage('surety')}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  currentPage === 'surety'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Surety Bond Underwriting
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentPage('sba');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2 px-4 text-sm font-medium rounded ${
                  currentPage === 'sba'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                SBA Loan Processing
              </button>
              <button
                onClick={() => {
                  setCurrentPage('surety');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2 px-4 text-sm font-medium rounded ${
                  currentPage === 'surety'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Surety Bond Underwriting
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {currentPage === 'sba' && <App />}
        {currentPage === 'surety' && <SuretyApplicationForm />}
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
