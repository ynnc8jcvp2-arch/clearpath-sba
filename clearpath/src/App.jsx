import React, { useState, useMemo, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import {
  Shield, FileText, Activity, AlertCircle,
  Download, Clock, Menu, X,
  Layers, CheckSquare, Info, MessageSquare,
  Landmark, Calculator, Loader2, Copy, Check,
  Factory, Briefcase, Users, Printer, ExternalLink,
  ChevronRight, ArrowRight, LogOut, LogIn
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  getAuthToken,
  getCurrentUser,
  signOut,
  signInWithGoogle,
  onAuthStateChange
} from './shared/utils/supabaseClient';

// ── SBA Loan Domain Components ──
import TermSheetTemplate from './domains/sba-loans/components/TermSheetTemplate';
import { exportTermSheetPDF, exportTermSheetHTML, printTermSheet } from './shared/utils/pdfExport';
import GenerativeFeatures from './domains/sba-loans/components/GenerativeFeatures';
import { PrincipalInterestChart, RemainingBalanceChart } from './domains/sba-loans/components/AmortizationCharts';
import PremiumForm, { PremiumRadioOption, PremiumCheckboxOption, PremiumInput, PremiumSelect } from './domains/sba-loans/components/PremiumForm';

// ── Turnstile CAPTCHA ──
import { Turnstile, verifyTurnstileToken } from './components/Turnstile';

// ── Surety Bond Domain Components (Commercial Bond Underwriting) ──
import SuretyDashboard from './domains/surety/components/SuretyDashboard';
import SpreadingEngine from './domains/surety/components/SpreadingEngine';
import WIPAnalyzer from './domains/surety/components/WIPAnalyzer';

// ── User Profile Component ──
import { UserProfile } from './components/UserProfile';

// ── Authenticated API Call Helper ──
async function fetchAPI(endpoint, method = 'GET', body = null) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(endpoint, options);

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    if (res.status === 403) {
      throw new Error('Permission denied. Your account does not have access to this feature.');
    }
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || error.message || `Request failed with status ${res.status}`);
  }

  return await res.json();
}

// ── AI via Vercel serverless — Claude claude-sonnet-4-6 ──
async function fetchAI(prompt, systemInstruction = '', jsonMode = false) {
  const delays = [1000, 2000, 4000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction, jsonMode }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.result;
    } catch (err) {
      if (i === delays.length) throw new Error('Service unavailable. Please retry.');
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
}

// ── Institutional Design Tokens ──
// Primary: Banking Navy #1B3A6B / Deep Navy #0A2540
// Accent actions only — no decorative color
const T = {
  card:        'bg-white border border-slate-300 rounded-sm',
  cardHover:   'bg-white border border-slate-300 hover:border-slate-500 rounded-sm transition-colors duration-150',
  input:       'w-full bg-white border border-slate-400 rounded-none px-3 py-2 text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B] transition-colors duration-150',
  label:       'block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1',
  btnPrimary:  'inline-flex items-center gap-2 bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-semibold text-sm px-4 py-2 rounded-none border border-[#0A2540] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnSecondary:'inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm px-4 py-2 rounded-none border border-slate-400 transition-colors duration-150 cursor-pointer disabled:opacity-50',
  btnGhost:    'inline-flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium text-sm px-3 py-2 rounded-none transition-colors duration-150 cursor-pointer',
  sectionHead: 'font-serif text-lg font-bold text-slate-900',
  sectionHeadLarge: 'font-serif text-2xl font-bold text-slate-900',
  sectionHeadAlt: 'font-serif text-xl font-bold text-[#1B3A6B]',
  kpiLabel:    'text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1',
  kpiValue:    'text-2xl font-bold tabular-nums text-white',
  dataLabel:   'text-xs font-semibold text-slate-600 uppercase tracking-wide',
  dataValue:   'text-sm tabular-nums font-semibold text-slate-900',
  th:          'py-2.5 px-4 text-xs font-semibold text-white uppercase tracking-wide text-left',
  td:          'py-2.5 px-4 text-sm tabular-nums text-slate-800',
};

// ── Term Sheet Preview Modal ──
function TermSheetModal({ data, onClose }) {
  const handlePrintTermSheet = () => {
    const element = document.getElementById('term-sheet-printable');
    if (element) {
      printTermSheet(element);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('term-sheet-printable');
    if (element) {
      exportTermSheetPDF(element, 'clearpath-term-sheet.pdf');
    }
  };

  const handleExportHTML = () => {
    const element = document.getElementById('term-sheet-printable');
    if (element) {
      exportTermSheetHTML(element, 'clearpath-term-sheet.html');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 overflow-y-auto">
      <div className="bg-[#0A2540] border-b border-[#1B3A6B] sticky top-0 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-white text-xs font-bold uppercase tracking-wide">Professional Term Sheet</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintTermSheet}
            className={T.btnSecondary + ' text-xs px-3 py-1.5'}
            aria-label="Print term sheet"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={handleExportPDF}
            className={T.btnPrimary + ' text-xs px-3 py-1.5'}
            aria-label="Download as PDF"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={handleExportHTML}
            className={T.btnSecondary + ' text-xs px-3 py-1.5'}
            aria-label="Download as HTML for editing"
          >
            <Download className="w-3.5 h-3.5" /> HTML
          </button>
          <button
            onClick={onClose}
            className="ml-2 text-slate-300 hover:text-white transition-colors duration-150 cursor-pointer"
            aria-label="Close term sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-white overflow-y-auto">
        <div className="max-w-8.5in mx-auto p-8">
          {data && <TermSheetTemplate data={data} />}
        </div>
      </div>
    </div>
  );
}

// ── Static data ──
const PROGRAMS = [
  { id: '7a_25',   label: '7(a) Real Estate',                 maxY: 25, rate: 'Prime + 2.75%', cap: '$5,000,000' },
  { id: '7a_10',   label: '7(a) Equipment / Working Capital', maxY: 10, rate: 'Prime + 2.75%', cap: '$5,000,000' },
  { id: 'express', label: 'SBA Express',                      maxY: 10, rate: 'Prime + 4.50%', cap: '$500,000'   },
  { id: '504',     label: 'SBA 504 (CDC portion)',             maxY: 20, rate: 'Fixed ~6–7%',   cap: '$5,500,000' },
];

const SCREENER_QUESTIONS = [
  { id: 'biz_age',        q: 'Operational history of borrowing entity',      hint: 'SBA SOP 50 10 7 requires a minimum of 2 years of documented operating history for standard eligibility.',     options: [{ label: 'Under 12 months',              value: 'under1',      flag: 'red'    }, { label: '12–24 months',              value: '1to2',        flag: 'yellow' }, { label: '24–60 months',              value: '2to5'                      }, { label: 'Over 60 months',            value: 'over5'                     }] },
  { id: 'biz_type',       q: 'Primary NAICS industry classification',         options: [{ label: 'Restaurant / Food Service',     value: 'food'                        }, { label: 'Retail Trade',               value: 'retail'                    }, { label: 'Professional Services',     value: 'service'                   }, { label: 'Passive Real Estate',       value: 'realestate',  flag: 'red'    }, { label: 'Restricted Industry',       value: 'restricted',  flag: 'red'    }, { label: 'Other Eligible Entity',     value: 'other'                     }] },
  { id: 'credit',         q: 'Primary guarantor FICO credit score',           hint: 'Minimum 650 required for standard SBA pre-qualification. Scores below 620 typically require compensating factors.',  options: [{ label: 'Below 580',                    value: 'poor',        flag: 'red'    }, { label: '580–619',                   value: 'fair',        flag: 'red'    }, { label: '620–649',                   value: 'neargood',    flag: 'yellow' }, { label: '650–699',                   value: 'good'                      }, { label: '700 or above',              value: 'excellent'                 }] },
  { id: 'purpose',        q: 'Designated use of loan proceeds',               options: [{ label: 'Working Capital / Operations',  value: 'working_capital'             }, { label: 'Equipment / Machinery',     value: 'equipment'                 }, { label: 'Commercial Real Estate',    value: 'realestate_purchase'       }, { label: 'Refinance Existing Debt',   value: 'refinance',   flag: 'yellow' }, { label: 'Pre-Revenue Startup',       value: 'startup',     flag: 'red'    }] },
  { id: 'federal_default', q: 'Federal obligation default history',           options: [{ label: 'No Prior Defaults',             value: 'no'                          }, { label: 'Prior Default — Resolved',  value: 'resolved',    flag: 'yellow' }, { label: 'Default — Unresolved',      value: 'unresolved',  flag: 'red'    }] },
];

// ── App shell ──
export default function App() {
  const [page, setPage] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    let unsubscribe;

    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Subscribe to auth changes
        unsubscribe = onAuthStateChange((session) => {
          setUser(session?.user || null);
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const nav = (p) => { setPage(p); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const handleUploadDocument = async (file) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const content = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]); // Extract base64 without data URI prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call surety upload API
      const response = await fetchAPI('/api/v1/surety/upload', 'POST', {
        document: {
          name: file.name,
          content,
          type: file.type,
        },
        documentType: 'general',
        extractTables: true,
        extractText: true,
      });

      console.log('Document uploaded successfully:', response);
      return response;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  };

  const NAV_ITEMS = [
    { id: 'home',       label: 'Overview'              },
    { id: 'calculator', label: 'Amortization Terminal' },
    { id: 'screener',   label: 'Eligibility Screener'  },
    { id: 'checklist',  label: 'Document Checklist'    },
    { id: 'compare',    label: 'Program Comparison'    },
    { id: 'surety',     label: 'Surety Underwriting',  type: 'domain' },
  ];

  const NavLink = ({ id, label }) => (
    <button
      onClick={() => nav(id)}
      className={`text-xs font-semibold uppercase tracking-wide px-3 py-2 transition-colors duration-150 cursor-pointer ${
        page === id
          ? 'bg-white text-[#0A2540]'
          : 'text-slate-300 hover:text-white hover:bg-[#1B3A6B]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-slate-900">

      {/* ── Header ── */}
      <header className="bg-[#0A2540] border-b border-[#1B3A6B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">

          {/* Wordmark */}
          <button
            onClick={() => nav('home')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
            aria-label="ClearPath — Home"
          >
            <div className="w-6 h-6 bg-white flex items-center justify-center" aria-hidden="true">
              <Landmark className="w-3.5 h-3.5 text-[#0A2540]" />
            </div>
            <span className="font-serif text-sm font-bold text-white">ClearPath</span>
            <span className="hidden sm:block text-slate-400 text-[10px] font-semibold uppercase tracking-wide ml-1 border-l border-[#1B3A6B] pl-2">
              SBA · Surety · Free Platform
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => <NavLink key={item.id} {...item} />)}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2 shrink-0">
            {!loading && (
              user ? (
                <UserProfile />
              ) : (
                <button
                  onClick={handleSignIn}
                  className={T.btnPrimary + ' text-xs py-1.5 px-3'}
                  aria-label="Sign in with Google"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Sign In</span>
                </button>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-300 hover:text-white transition-colors duration-150 cursor-pointer p-1"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-[#1B3A6B] bg-[#0A2540] px-4 py-2 flex flex-col">
            {NAV_ITEMS.map(item => <NavLink key={item.id} {...item} />)}
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {page === 'home'       && <Overview nav={nav} />}
        {page === 'calculator' && <AmortizationTerminal nav={nav} user={user} />}
        {page === 'screener'   && <EligibilityScreener nav={nav} />}
        {page === 'checklist'  && <DocumentChecklist />}
        {page === 'compare'    && <ProgramComparison />}
        {page === 'surety'     && <SuretyDashboard onNavigate={nav} onUploadDocument={handleUploadDocument} user={user} />}
        {page === 'spreading'  && <SpreadingEngine onBack={() => nav('surety')} />}
        {page === 'wip'        && <WIPAnalyzer onBack={() => nav('surety')} />}
        {page === 'contact'    && <ContactPage />}
      </main>

      <SpeedInsights />

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-300 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Contact + Links Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Contact Info */}
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-2">Contact</p>
              <a href="mailto:support@clearpathsbaloan.com" className="text-xs text-[#1B3A6B] hover:underline font-medium">
                support@clearpathsbaloan.com
              </a>
              <p className="text-xs text-slate-600 mt-1">Response within 1-2 business days</p>
            </div>
            {/* Quick Links */}
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-2">Quick Links</p>
              <div className="flex flex-col gap-1">
                <button onClick={() => nav('calculator')} className="text-xs text-[#1B3A6B] hover:underline text-left">Amortization Terminal</button>
                <button onClick={() => nav('screener')} className="text-xs text-[#1B3A6B] hover:underline text-left">Eligibility Screener</button>
                <button onClick={() => nav('contact')} className="text-xs text-[#1B3A6B] hover:underline text-left">Contact Form</button>
              </div>
            </div>
            {/* Resources */}
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-2">Resources</p>
              <div className="flex flex-col gap-1">
                <a href="https://www.sba.gov/funding-programs/loans" target="_blank" rel="noopener noreferrer" className="text-xs text-[#1B3A6B] hover:underline">SBA.gov Loan Programs</a>
                <a href="https://www.sba.gov/document/sop-50-10-7-lender-development-company-loan-programs" target="_blank" rel="noopener noreferrer" className="text-xs text-[#1B3A6B] hover:underline">SBA SOP 50 10 7</a>
              </div>
            </div>
          </div>
          {/* Disclaimer */}
          <div className="pt-5 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-2">
              Legal Disclaimer &amp; Terms of Use
            </p>
            <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
              ClearPath SBA is an independent educational and software platform.{' '}
              <strong className="text-slate-900">Not a bank, lender, or financial institution.</strong>{' '}
              No loans are issued, no credit decisions are made, and no funding is guaranteed. All
              calculations, matrices, and AI-generated documents are for informational and structural
              planning purposes only. SBA guidelines are subject to change; verify directly with an
              authorized SBA Preferred Lender and current SOP documentation before any credit action.
            </p>
            <p className="text-[10px] text-slate-500 mt-3">
              &copy; {new Date().getFullYear()} ClearPath SBA Tools. All rights reserved.
              Ad-supported; no paywalls, no user data sold.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW (Home)
// ═══════════════════════════════════════════════════════════
function Overview({ nav }) {
  const MODULES = [
    {
      n: '01', id: 'calculator',
      title: 'Amortization Terminal',
      tagline: 'Model loan payments in seconds',
      desc: 'Model loan amortization, calculate debt service, apply FY26 manufacturer fee waivers, and compile formal term sheets.',
      action: 'Open Terminal',
      icon: Activity,
    },
    {
      n: '02', id: 'screener',
      title: 'Eligibility Screener',
      tagline: 'Pre-qualify applicants instantly',
      desc: 'Screen applicants against SBA SOP 50 10 7 qualification criteria prior to formal underwriting submission.',
      action: 'Screen Applicant',
      icon: Shield,
    },
    {
      n: '03', id: 'checklist',
      title: 'Document Checklist',
      tagline: 'Generate regulatory matrices',
      desc: 'Generate entity- and transaction-specific document requirement matrices with inline regulatory definitions.',
      action: 'Build Checklist',
      icon: CheckSquare,
    },
    {
      n: '04', id: 'compare',
      title: 'Program Comparison',
      tagline: 'Compare SBA product options',
      desc: 'Side-by-side comparison of 7(a), 504, and Express capital limits, rates, terms, and use-of-proceeds restrictions.',
      action: 'Compare Programs',
      icon: Layers,
    },
  ];

  const AUDIENCES = [
    { role: 'Commercial Loan Officers',   function: 'Amortization, term sheet compilation, pre-screening.', icon: Briefcase },
    { role: 'Manufacturing CEOs',         function: 'FY26 NAICS 31-33 fee waiver calculation and modeling.', icon: Factory  },
    { role: 'CPAs & Fractional CFOs',     function: 'Compliance matrix generation and debt service analysis.', icon: Calculator },
    { role: 'B2B Equipment Vendors',      function: 'Live payment modeling and program eligibility at point-of-sale.', icon: Users },
  ];

  return (
    <div className="space-y-5">

      {/* FY26 Regulatory Alert (De-emphasized) */}
      <div className="bg-white border-t border-slate-200 px-5 py-2 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5">
            FY2026 Manufacturer Fee Waiver (NAICS 31–33)
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            Qualifying manufacturers save on SBA upfront guaranty fees through September 30, 2026.
          </p>
        </div>
        <button onClick={() => nav('calculator')} className="text-xs text-slate-700 hover:text-slate-900 whitespace-nowrap font-medium transition-colors">
          Estimate Savings →
        </button>
      </div>

      {/* Module Index */}
      <section>
        <h1 className={`${T.sectionHeadLarge} mb-4`}>SBA 7(a) Lending Tools</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-300 border border-slate-300 overflow-hidden">
          {MODULES.map((m) => (
            <div key={m.id} className="bg-white p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide tabular-nums">{m.n}</span>
                <div className="bg-slate-100 rounded-lg p-2">
                  <m.icon className="w-6 h-6 text-slate-700" />
                </div>
              </div>
              <div>
                <h2 className="font-serif text-sm font-bold text-slate-900 mb-0.5">{m.title}</h2>
                <p className="text-xs text-slate-500 font-medium mb-1">{m.tagline}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
              </div>
              <button
                onClick={() => nav(m.id)}
                className={T.btnSecondary + ' w-full justify-center mt-auto text-xs py-1.5'}
              >
                {m.action} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Surety Bond Underwriting Domain */}
      <section className="border-t-2 border-slate-300 pt-6">
        <div className="pb-3 mb-3 flex items-center justify-between">
          <h1 className={`${T.sectionHeadAlt}`}>
            Commercial Surety Bond Underwriting
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-3 px-2 py-1 bg-blue-50 text-blue-700 rounded-full inline-block">Beta</span>
          </h1>
        </div>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Comprehensive commercial surety bond underwriting tools including work-in-progress analysis, financial spreading, and contractor risk assessment. Built on the same document parsing engine as the SBA module.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-px bg-slate-300 border border-slate-300 overflow-hidden">
          <div className="bg-white p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide tabular-nums">SURETY</span>
              <div className="bg-slate-100 rounded-lg p-2">
                <Briefcase className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-slate-900 mb-0.5">Bond Underwriting Dashboard</h2>
              <p className="text-xs text-slate-500 font-medium mb-1">Upload & analyze bonds</p>
              <p className="text-xs text-slate-600 leading-relaxed">Document upload, shared parser integration, and links to analysis tools.</p>
            </div>
            <button
              onClick={() => nav('surety')}
              className={T.btnSecondary + ' w-full justify-center mt-auto text-xs py-1.5'}
            >
              Open Dashboard <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-white p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide tabular-nums">ANALYSIS</span>
              <div className="bg-slate-100 rounded-lg p-2">
                <Calculator className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-slate-900 mb-0.5">As-Allowed Spreading Engine</h2>
              <p className="text-xs text-slate-500 font-medium mb-1">Financial health & risk</p>
              <p className="text-xs text-slate-600 leading-relaxed">SBA 13(g)(2) financial analysis, EBITDA calculation, and health scoring.</p>
            </div>
            <button
              onClick={() => nav('spreading')}
              className={T.btnSecondary + ' w-full justify-center mt-auto text-xs py-1.5'}
            >
              Open Engine <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Two-column: rates table + audience index */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* SBA Product Rate Table */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className={T.sectionHead}>Current SBA Product Limits</h2>
            <button onClick={() => nav('compare')} className={T.btnGhost + ' text-xs'}>
              Full Comparison →
            </button>
          </div>
          <div className="border border-slate-300 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#0A2540]">
                  <th className={T.th}>Program</th>
                  <th className={T.th + ' text-right'}>Max Capital</th>
                  <th className={T.th + ' text-right'}>Rate Basis</th>
                  <th className={T.th + ' text-right'}>Max Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {PROGRAMS.map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100 transition-colors duration-150`}>
                    <td className="py-2.5 px-4 text-sm font-medium text-slate-900">{p.label}</td>
                    <td className="py-2.5 px-4 text-sm tabular-nums text-slate-900 font-semibold text-right">{p.cap}</td>
                    <td className="py-2.5 px-4 text-sm tabular-nums text-slate-700 text-right">{p.rate}</td>
                    <td className="py-2.5 px-4 text-sm tabular-nums text-slate-700 text-right">{p.maxY} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Authorized User Classifications */}
        <section>
          <h2 className={`${T.sectionHead} mb-2`}>Authorized Users</h2>
          <div className="border border-slate-300 divide-y divide-slate-200 bg-white">
            {AUDIENCES.map((a, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div className="w-7 h-7 bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <a.icon className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{a.role}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{a.function}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AMORTIZATION TERMINAL
// ═══════════════════════════════════════════════════════════
function pmt(rate, nper, pv) {
  if (rate === 0) return pv / nper;
  return (rate * pv * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
}

function AmortizationTerminal({ nav, user }) {
  const [amount,   setAmount]   = useState('450000');
  const [rateStr,  setRateStr]  = useState('10.50');
  const [years,    setYears]    = useState('10');
  const [prog,     setProg]     = useState('7a_10');
  const [mfr,      setMfr]      = useState(false);

  const [extractNotes,      setExtractNotes]      = useState('');
  const [extracting,        setExtracting]        = useState(false);
  const [extractStatus,     setExtractStatus]     = useState(null);
  const [narrative,         setNarrative]         = useState('');
  const [officerEmail,      setOfficerEmail]      = useState('');
  const [generating,        setGenerating]        = useState(false);
  const [generateStatus,    setGenerateStatus]    = useState(null);
  const [termSheetData,     setTermSheetData]     = useState(null);
  const [modalOpen,         setModalOpen]         = useState(false);
  const [copied,            setCopied]            = useState(null);
  const [error,             setError]             = useState(null);

  const principal   = parseFloat(amount.replace(/,/g, '')) || 0;
  const annualRate  = parseFloat(rateStr) / 100 || 0;
  const n           = parseInt(years) * 12;
  const mr          = annualRate / 12;
  const monthly     = useMemo(() => principal > 0 && n > 0 ? pmt(mr, n, principal) : 0, [principal, mr, n]);
  const totalRepaid   = monthly * n;
  const totalInterest = totalRepaid - principal;
  const principalPct  = totalRepaid > 0 ? (principal / totalRepaid) * 100 : 0;

  const estFee = useMemo(() => {
    if (prog.includes('7a')) return principal * 0.0275;
    if (prog === '504')      return principal * 0.025;
    if (prog === 'express')  return principal * 0.02;
    return principal * 0.025;
  }, [principal, prog]);
  const finalFee   = mfr ? 0 : estFee;
  const feeSavings = estFee - finalFee;

  const usd  = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const usd2 = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;top:0;left:0' });
      document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    });
    setCopied(id); setTimeout(() => setCopied(null), 1400);
  };

  const exportCSV = () => {
    let csv = 'Month,Payment,Principal,Interest,Balance\n';
    let bal = principal;
    for (let i = 1; i <= n; i++) {
      const int = bal * mr, pri = monthly - int; bal = Math.max(0, bal - pri);
      csv += `${i},${monthly.toFixed(2)},${pri.toFixed(2)},${int.toFixed(2)},${bal.toFixed(2)}\n`;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `Amortization_${principal}.csv`; a.click();
  };

  const copyAll = () => {
    let tsv = 'Month\tPayment\tPrincipal\tInterest\tBalance\n';
    let bal = principal;
    for (let i = 1; i <= n; i++) {
      const int = bal * mr, pri = monthly - int; bal = Math.max(0, bal - pri);
      tsv += `${i}\t${monthly.toFixed(2)}\t${pri.toFixed(2)}\t${int.toFixed(2)}\t${bal.toFixed(2)}\n`;
    }
    copy(tsv, 'all');
  };

  const handleExtract = async () => {
    if (!extractNotes.trim()) return;
    setExtracting(true);
    setError(null);
    setExtractStatus(null);
    try {
      const data = await fetchAI(
        `Extract commercial loan parameters from: "${extractNotes}"\n\nReturn JSON: { amount, program (7a_25|7a_10|express|504), years, assessment }`,
        'Commercial loan structuring assistant. Return valid JSON only.',
        true
      );
      if (data.amount)   setAmount(Number(data.amount).toLocaleString());
      if (data.program && PROGRAMS.some(p => p.id === data.program)) setProg(data.program);
      if (data.years)    setYears(data.years);
      if (data.assessment) setNarrative(data.assessment);
      setExtractStatus('success');
      setTimeout(() => setExtractStatus(null), 3000);
    } catch (e) {
      setError(e.message);
      setExtractStatus('error');
    }
    finally { setExtracting(false); }
  };

  const handleCompile = async () => {
    if (!user) {
      setError('Please sign in to generate term sheets.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGenerateStatus(null);
    try {
      // Call backend API to calculate loan analysis
      const apiResponse = await fetchAPI(
        '/api/v1/sba-loans/calculate-amortization',
        'POST',
        {
          requestedAmount: principal,
          annualRate: parseFloat(rateStr),
          loanTermYears: parseInt(years),
          netOperatingIncome: 100000, // Default NOI - should come from user input
          totalProjectCost: principal * 1.2,
          borrowerNAICS: mfr ? 311 : 234, // 311 = Manufacturing (triggers waiver)
          borrowerName: '[Borrower Name]',
        }
      );

      // Extract analysis data from API response
      const analysis = apiResponse.analysis || {};
      const progLabel = PROGRAMS.find(p => p.id === prog)?.label;

      // Get underwriting narrative from AI
      const narrativeData = await fetchAI(
        `Generate 2-3 sentence executive underwriting summary for this SBA loan:\n\nProgram: ${progLabel}\nPrincipal: $${amount}\nRate: ${rateStr}%\nMonthly Payment: ${usd2(monthly)}\nDSCR: ${(analysis.dscr || 1.25).toFixed(2)}x\n\nReturn JSON: { narrative: "..." }`,
        'Commercial banking underwriter. Keep summary to 2-3 sentences.',
        true
      ).catch(() => ({ narrative: 'Structurally sound commercial expansion opportunity with strong market fundamentals.' }));

      // Build term sheet data from API response
      const termSheetData = {
        parties: {
          borrower: '[Borrower Name]',
          lender: 'ClearPath SBA',
          officer: officerEmail ? officerEmail.split('@')[0] : 'Loan Officer'
        },
        facility: {
          amount: principal,
          program: progLabel,
          index: 'Prime',
          margin: (parseFloat(rateStr) - 8.5).toFixed(2),
          annual_rate: rateStr,
          term: parseInt(years),
          payments: n
        },
        debt_service: {
          monthly: monthly,
          annual: monthly * 12,
          dscr: analysis.dscr || 1.25
        },
        equity: {
          required_pct: 10,
          required_amount: principal * 0.1
        },
        collateral: [
          'Commercial real estate or equipment',
          'Personal guarantees from principal owners'
        ],
        covenants: {
          dscr_min: Math.max(1.0, analysis.dscr || 1.25),
          current_ratio_min: 1.2,
          debt_ratio_max: 2.0,
          testing_frequency: 'Annual'
        },
        fees: {
          origination_pct: analysis.fees?.originationPct || 2.75,
          origination: analysis.fees?.origination || (principal * 0.0275),
          guaranty_pct: analysis.fees?.guarantyPct || 1.5,
          guaranty: analysis.fees?.guaranty || (principal * 0.015),
          waiver_applicable: mfr,
          waiver_savings: analysis.fees?.waiverSavings || 0,
          total_fees: (analysis.fees?.origination || 0) + (analysis.fees?.guaranty || 0)
        },
        narrative: narrativeData.narrative || 'Structurally sound commercial expansion opportunity with strong market fundamentals.',
        effective_date: new Date().toLocaleDateString(),
        maturity_date: new Date(new Date().setFullYear(new Date().getFullYear() + parseInt(years))).toLocaleDateString()
      };

      setTermSheetData(termSheetData);
      setGenerateStatus('success');
      setModalOpen(true);
    } catch (e) {
      console.error('Error in handleCompile:', e);
      setError(e.message || 'Failed to generate term sheet. Please try again.');
      setGenerateStatus('error');
    }
    finally { setGenerating(false); }
  };

  // Full amortization schedule for charting and display
  const fullScheduleData = useMemo(() => {
    const rows = [];
    let bal = principal;
    for (let i = 1; i <= n; i++) {
      const int = bal * mr, pri = monthly - int;
      bal = Math.max(0, bal - pri);
      rows.push({ m: i, pay: monthly, pri, int, bal });
    }
    return rows;
  }, [principal, mr, monthly, n]);

  // First 12 months for table display
  const scheduleRows = useMemo(() => {
    return fullScheduleData.slice(0, 12);
  }, [fullScheduleData]);

  const selectedProg = PROGRAMS.find(p => p.id === prog);

  return (
    <>
      {modalOpen && termSheetData && (
        <TermSheetModal data={termSheetData} onClose={() => setModalOpen(false)} />
      )}

      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <div>
            <h1 className={`${T.sectionHead} text-xl`}>Amortization Terminal</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Loan structuring · Amortization modeling · Term sheet compilation · FY26 fee waiver
            </p>
          </div>
          <span className="hidden sm:block text-[10px] font-bold text-slate-600 uppercase tracking-wide border border-slate-400 px-2 py-1">
            SBA SOP 50 10 7
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-white border border-red-400 border-l-4 border-l-red-600 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {!user && (
          <div className="flex items-start gap-3 bg-white border border-blue-400 border-l-4 border-l-blue-600 px-4 py-3 flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">API Features Require Authentication</p>
                <p className="text-xs mt-0.5">Sign in to access loan calculation and term sheet generation powered by your backend API.</p>
              </div>
            </div>
            <button onClick={() => signInWithGoogle().catch(console.error)} className={T.btnPrimary + ' text-xs py-1.5 px-3 shrink-0'}>
              Sign In
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-4">

          {/* ── LEFT COLUMN: Inputs ── */}
          <div className="lg:col-span-5 space-y-3">

            {/* ── Phase 2: Generative Features Panel ── */}
            <GenerativeFeatures
              onExtractParameters={handleExtract}
              onCompileTermSheet={handleCompile}
              extractLoading={extracting}
              compileLoading={generating}
              extractStatus={extractStatus}
              compileStatus={generateStatus}
              dealNotes={extractNotes}
              onDealNotesChange={setExtractNotes}
              loanComplete={Boolean(amount && principal > 0)}
              extractComplete={extractStatus === 'success'}
            />

            {/* Loan Parameters */}
            <div className={T.card + ' p-4'}>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">Loan Parameters</h2>

              <div className="space-y-4">
                {/* Program */}
                <div>
                  <label className={T.label} htmlFor="prog-select">SBA Program</label>
                  <select
                    id="prog-select"
                    value={prog}
                    onChange={e => {
                      setProg(e.target.value);
                      const p = PROGRAMS.find(p => p.id === e.target.value);
                      if (p && parseInt(years) > p.maxY) setYears(String(p.maxY));
                    }}
                    className={T.input}
                  >
                    {PROGRAMS.map(p => (
                      <option key={p.id} value={p.id}>{p.label} — {p.note || p.rate}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className={T.label} htmlFor="amount-input">Requested Capital (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-semibold">$</span>
                    <input
                      id="amount-input"
                      type="text"
                      value={Number(amount.replace(/,/g, '')).toLocaleString()}
                      onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className={T.input + ' pl-7'}
                    />
                  </div>
                </div>

                {/* Rate + Term */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={T.label} htmlFor="rate-slider">Interest Rate</label>
                      <span className="text-xs font-bold tabular-nums text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5">{rateStr}%</span>
                    </div>
                    <input
                      id="rate-slider"
                      type="range" min="4" max="20" step="0.25"
                      value={rateStr}
                      onChange={e => setRateStr(parseFloat(e.target.value).toFixed(2))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={T.label} htmlFor="term-slider">Loan Term</label>
                      <span className="text-xs font-bold tabular-nums text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5">{years} yr</span>
                    </div>
                    <input
                      id="term-slider"
                      type="range" min="1" max={selectedProg?.maxY || 25}
                      value={years}
                      onChange={e => setYears(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* FY26 Waiver */}
                <div className="border-t border-slate-200 pt-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 mt-0.5 border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${mfr ? 'bg-[#1B3A6B] border-[#1B3A6B]' : 'bg-white border-slate-400 group-hover:border-slate-600'}`}>
                      <input type="checkbox" className="sr-only" checked={mfr} onChange={e => setMfr(e.target.checked)} />
                      {mfr && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Apply FY26 NAICS 31-33 Manufacturer Fee Waiver
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Eliminates upfront SBA guaranty fees for manufacturing entities.{' '}
                        <strong className="text-slate-800">Expires Sep 30, 2026.</strong>
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Officer Details (for term sheet) */}
            <div className={T.card + ' p-4'}>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">Officer Details</h2>
              <div className="space-y-3">
                <div>
                  <label className={T.label} htmlFor="officer-email">Originating Officer Email</label>
                  <input
                    id="officer-email"
                    type="email"
                    value={officerEmail}
                    onChange={e => setOfficerEmail(e.target.value)}
                    placeholder="officer@institution.com"
                    className={T.input}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Output ── */}
          <div className="lg:col-span-7 space-y-4">

            {/* KPI Summary Bar */}
            <div className="bg-[#0A2540] border border-[#1B3A6B] p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div>
                  <p className={T.kpiLabel}>Monthly D/S</p>
                  <p className={T.kpiValue + ' text-3xl'}>{usd2(monthly)}</p>
                </div>
                <div>
                  <p className={T.kpiLabel}>Total Interest</p>
                  <p className={T.kpiValue + ' text-3xl'}>{usd(totalInterest)}</p>
                </div>
                <div>
                  <p className={T.kpiLabel}>Annual Rate</p>
                  <p className={T.kpiValue + ' text-2xl'}>{rateStr}%</p>
                </div>
                <div>
                  <p className={T.kpiLabel}>Guaranty Fee</p>
                  <p className={`${T.kpiValue} ${mfr ? 'text-green-300' : ''}`}>
                    {usd(finalFee)}
                    {mfr && <span className="ml-2 text-[10px] font-bold text-green-300 uppercase tracking-wide">Waived</span>}
                  </p>
                  {mfr && <p className="text-[10px] tabular-nums text-slate-400 line-through">{usd(estFee)}</p>}
                </div>
              </div>

              {/* Principal / Interest composition bar */}
              <div>
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide mb-1.5">
                  <span className="text-white">Principal — {principalPct.toFixed(0)}%</span>
                  <span className="text-slate-400">Interest — {(100 - principalPct).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#1B3A6B] overflow-hidden flex border border-slate-600">
                  <div
                    className="bg-white h-full transition-all duration-150"
                    style={{ width: `${principalPct}%` }}
                  />
                  <div className="bg-slate-600 h-full flex-1" />
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-[10px] text-slate-400">
                  <span className="tabular-nums">{years}-year term · {n} payments · {rateStr}% annual rate</span>
                  {mfr && (
                    <span className="text-green-300 font-bold uppercase tracking-wide">FY26 Waiver Active</span>
                  )}
                </div>
              </div>
            </div>

            {/* Amortization Charts (Phase 3) */}
            <PrincipalInterestChart scheduleData={fullScheduleData} />
            <RemainingBalanceChart scheduleData={fullScheduleData} />

            {/* Amortization Schedule */}
            <div className="border border-slate-300 overflow-hidden bg-white">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Amortization Schedule</span>
                  <span className="text-[10px] text-slate-600 border border-slate-300 px-1.5 py-0.5 bg-white tabular-nums">
                    First 12 months of {n}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={copyAll} className={T.btnSecondary + ' text-xs py-1.5 px-3'} aria-label="Copy amortization data to clipboard">
                    {copied === 'all' ? <Check className="w-3.5 h-3.5 text-[#1B3A6B]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'all' ? 'Copied' : 'Copy Data'}
                  </button>
                  <button onClick={exportCSV} className={T.btnSecondary + ' text-xs py-1.5 px-3'} aria-label="Export amortization schedule as CSV">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
                <table className="w-full border-collapse min-w-[560px]">
                  <caption className="sr-only">SBA Loan Amortization Schedule — First 12 Months</caption>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#0A2540]">
                      <th className={T.th + ' w-16'}>Mo.</th>
                      <th className={T.th + ' text-right'}>Payment</th>
                      <th className={T.th + ' text-right'}>Principal</th>
                      <th className={T.th + ' text-right'}>Interest</th>
                      <th className={T.th + ' text-right'}>Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {scheduleRows.map((r, idx) => (
                      <tr key={r.m} className={`${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100 transition-colors duration-150 group`}>
                        <td className="py-2 px-4 text-xs font-bold tabular-nums text-slate-800">{r.m}</td>
                        {[['pay', r.pay], ['pri', r.pri], ['int', r.int], ['bal', r.bal]].map(([k, v]) => (
                          <td
                            key={k}
                            onClick={() => copy(usd2(v), `${k}-${r.m}`)}
                            className="py-2 px-4 text-right text-sm tabular-nums cursor-pointer"
                            title={`Copy ${k}`}
                          >
                            <span className={`
                              ${k === 'pay' ? 'font-semibold text-slate-900' : ''}
                              ${k === 'int' ? 'text-slate-600' : 'text-slate-800'}
                              ${k === 'bal' ? 'font-medium' : ''}
                            `}>
                              {copied === `${k}-${r.m}`
                                ? <span className="text-[#1B3A6B] font-semibold">Copied</span>
                                : usd2(v)
                              }
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={5} className="py-2 px-4 text-center text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                        Displaying months 1–{Math.min(n, 12)} of {n} · Click any cell to copy · Export CSV for full schedule
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ELIGIBILITY SCREENER
// ═══════════════════════════════════════════════════════════
function EligibilityScreener({ nav }) {
  const [current,  setCurrent]  = useState(0);
  const [answers,  setAnswers]  = useState({});
  const [selected, setSelected] = useState('');
  const [result,   setResult]   = useState(null);

  const q = SCREENER_QUESTIONS[current];

  const advance = () => {
    if (!selected) return;
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    setSelected('');
    if (current + 1 >= SCREENER_QUESTIONS.length) {
      let reds = 0, yellows = 0;
      SCREENER_QUESTIONS.forEach(question => {
        const opt = question.options.find(o => o.value === next[question.id]);
        if (opt?.flag === 'red')    reds++;
        if (opt?.flag === 'yellow') yellows++;
      });
      setResult(reds === 0 && yellows === 0 ? 'approved' : reds > 0 ? 'disqualified' : 'conditional');
    } else {
      setCurrent(c => c + 1);
    }
  };

  const reset = () => { setCurrent(0); setAnswers({}); setSelected(''); setResult(null); };

  if (result) {
    const cfg = {
      approved:     { label: 'Pre-Qualification: Approved'     },
      conditional:  { label: 'Pre-Qualification: Conditional'  },
      disqualified: { label: 'Pre-Qualification: Disqualified' },
    }[result];

    const borderCls = result === 'approved' ? 'border-l-green-700'  : result === 'conditional' ? 'border-l-amber-600' : 'border-l-red-700';
    const textCls   = result === 'approved' ? 'text-green-800'      : result === 'conditional' ? 'text-amber-800'     : 'text-red-800';
    const bgCls     = result === 'approved' ? 'bg-green-50'         : result === 'conditional' ? 'bg-amber-50'        : 'bg-red-50';

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className={`bg-white border border-slate-300 border-l-4 ${borderCls} p-6`}>
          <div className={`inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 mb-4 ${bgCls} ${textCls} border ${result === 'approved' ? 'border-green-300' : result === 'conditional' ? 'border-amber-300' : 'border-red-300'}`}>
            {cfg.label}
          </div>

          <p className="text-sm text-slate-800 leading-relaxed mb-6">
            {result === 'approved'
              ? 'Application parameters satisfy foundational SBA SOP 50 10 7 credit requirements. Proceed to loan structuring and document collection.'
              : result === 'conditional'
              ? 'One or more conditional factors identified. Application may qualify subject to lender discretion and compensating documentation.'
              : 'One or more hard-stop criteria identified under SBA SOP 50 10 7. Standard SBA program financing is not available under current parameters.'}
          </p>

          {(result === 'approved' || result === 'conditional') && (
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <button onClick={() => nav('calculator')} className={T.btnPrimary + ' justify-center'}>
                <Calculator className="w-4 h-4" /> Open Amortization Terminal
              </button>
              <button onClick={() => nav('checklist')} className={T.btnSecondary + ' justify-center'}>
                <CheckSquare className="w-4 h-4" /> Build Document Checklist
              </button>
            </div>
          )}

          {result === 'disqualified' && (
            <div className="border border-slate-300 overflow-hidden mb-6">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Alternative Financing Pathways</span>
              </div>
              {[
                ['SBA Microloan Program',       'Loans up to $50,000; more flexible credit requirements for early-stage businesses.'],
                ['CDFI Network',                'Community Development Financial Institutions serve borrowers outside standard SBA thresholds.'],
                ['Credit Score Remediation',    'FICO above 650 unlocks standard SBA eligibility. Disciplined payment history over 60–90 days typically produces measurable score improvement.'],
                ['SBA Lender Match',            'Official SBA platform matching applicants with lenders specializing in non-standard files.'],
              ].map(([title, desc]) => (
                <div key={title} className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-start gap-3">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={reset} className={T.btnSecondary} aria-label="Start new eligibility inquiry">New Inquiry</button>
        </div>

      </div>
    );
  }

  return (
    <PremiumForm
      title={`${q.q}`}
      subtitle={q.hint || 'Select the option that best describes your situation.'}
      currentStep={current + 1}
      totalSteps={SCREENER_QUESTIONS.length}
      onBack={() => {
        if (current > 0) {
          setCurrent(c => c - 1);
          setSelected(answers[SCREENER_QUESTIONS[current - 1].id] || '');
        }
      }}
      onNext={advance}
      backDisabled={current === 0}
      nextDisabled={!selected}
      isLastStep={current + 1 === SCREENER_QUESTIONS.length}
      nextLabel={current + 1 === SCREENER_QUESTIONS.length ? 'Submit for Analysis' : 'Continue'}
    >
      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt) => (
          <PremiumRadioOption
            key={opt.value}
            value={opt.value}
            selected={selected === opt.value}
            label={opt.label}
            description={null}
            flag={opt.flag || 'none'}
            onChange={setSelected}
          />
        ))}
      </div>
    </PremiumForm>
  );
}

// ═══════════════════════════════════════════════════════════
// DOCUMENT CHECKLIST
// ═══════════════════════════════════════════════════════════
function DocumentChecklist() {
  const [loanType,    setLoanType]    = useState('');
  const [entity,      setEntity]      = useState('');
  const [explaining,  setExplaining]  = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [checked,     setChecked]     = useState(new Set());

  const items = (loanType && entity) ? [
    'SBA Form 1919 — Borrower Information Form',
    'SBA Form 413 — Personal Financial Statement',
    '3 Years Federal Business Tax Returns',
    'YTD Profit & Loss Statement and Balance Sheet',
    'Business Debt Schedule',
    'Government-Issued Photo Identification',
    entity === 'LLC' ? 'LLC Operating Agreement' : 'Articles of Incorporation',
    loanType === 'real_estate' ? 'Commercial Real Estate Purchase Contract' : 'Detailed Use of Proceeds Statement',
  ] : [];

  const explain = async (item) => {
    setExplaining(item); setLoading(true); setExplanation('');
    try {
      const text = await fetchAI(
        `In 2–3 precise sentences, explain why the SBA requires this document for underwriting: "${item}". Be strictly factual.`,
        'Formal commercial banking compliance system.'
      );
      setExplanation(text);
    } catch {
      setExplanation('Definition unavailable. Consult SBA SOP 50 10 7 directly.');
    } finally { setLoading(false); }
  };

  const toggle = (item) => {
    const next = new Set(checked);
    next.has(item) ? next.delete(item) : next.add(item);
    setChecked(next);
  };

  const completedCount = items.filter(i => checked.has(i)).length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <div>
          <h1 className={`${T.sectionHead} text-xl`}>Compliance Document Checklist</h1>
          <p className="text-xs text-slate-600 mt-0.5">Generate entity- and transaction-specific SBA document requirements</p>
        </div>
      </div>

      <div className={T.card + ' p-4'}>
        <div className="grid sm:grid-cols-2 gap-6">
          <PremiumSelect
            id="loan-type"
            label="Transaction Classification"
            value={loanType}
            onChange={e => { setLoanType(e.target.value); setExplaining(null); setChecked(new Set()); }}
            options={[
              { value: '', label: 'Select transaction type…' },
              { value: 'working_capital', label: 'Working Capital / Equipment Acquisition' },
              { value: 'real_estate', label: 'Commercial Real Estate' },
              { value: 'acquisition', label: 'Business Acquisition' },
            ]}
            required
          />
          <PremiumSelect
            id="entity-type"
            label="Borrowing Entity Structure"
            value={entity}
            onChange={e => { setEntity(e.target.value); setExplaining(null); setChecked(new Set()); }}
            options={[
              { value: '', label: 'Select entity type…' },
              { value: 'LLC', label: 'Limited Liability Company (LLC)' },
              { value: 'Corp', label: 'S-Corporation / C-Corporation' },
              { value: 'SoleProp', label: 'Sole Proprietorship' },
            ]}
            required
          />
        </div>
      </div>

      {items.length > 0 && (
        <div className="border border-slate-300 overflow-hidden bg-white">
          <div className="bg-slate-50 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Required Documents</span>
              <span className="text-[10px] tabular-nums text-slate-700 bg-white border border-slate-300 px-2 py-0.5">
                {completedCount} / {items.length} confirmed
              </span>
            </div>
            <button
              onClick={() => window.print()}
              className={T.btnSecondary + ' text-xs py-1.5 px-3'}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-slate-200">
            <div
              className="h-full bg-[#1B3A6B] transition-all duration-150"
              style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
            />
          </div>

          <div className="divide-y divide-slate-200">
            {items.map((item) => (
              <div key={item}>
                <div
                  onClick={() => toggle(item)}
                  className="px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 rounded-sm transition-colors duration-150 ${checked.has(item) ? 'bg-[#1B3A6B] border-[#1B3A6B]' : 'bg-white border-slate-400 group-hover:border-slate-600'}`}>
                      {checked.has(item) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-150 ${checked.has(item) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {item}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); explain(item); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-bold text-slate-700 uppercase tracking-wide bg-white border border-slate-300 hover:border-slate-500 px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer rounded-sm shrink-0"
                    aria-label={`Define: ${item}`}
                  >
                    <MessageSquare className="w-3 h-3" /> Define
                  </button>
                </div>

                {explaining === item && (
                  <div className="px-12 py-3 bg-slate-50 border-t border-slate-200">
                    {loading
                      ? <div className="flex items-center gap-2 text-slate-600 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Retrieving definition…</div>
                      : (
                        <div className="text-xs text-slate-800 leading-relaxed">
                          {explanation}
                          <p className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
                            AI-generated reference only. Verify all document requirements against current{' '}
                            <strong>SBA SOP 50 10 7</strong> and your authorized SBA Preferred Lender.
                          </p>
                        </div>
                      )
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRAM COMPARISON
// ═══════════════════════════════════════════════════════════
function ProgramComparison() {
  const ROWS = [
    ['Maximum Loan Amount',        '$5,000,000',           '$5,500,000',                 '$500,000'                 ],
    ['Interest Rate Basis',        'Variable (Prime + 2.75%)', 'Fixed — CDC Portion',    'Variable (Prime + 4.50%)' ],
    ['Maximum Term — Real Estate', '25 years',             '20 years',                   'N/A'                      ],
    ['Maximum Term — Equipment',   '10 years',             'N/A',                        '10 years'                 ],
    ['Maximum Term — Working Cap', '10 years',             'N/A',                        '10 years'                 ],
    ['Required Equity Injection',  '10–20%',               '10–15%',                     'Lender discretion'        ],
    ['Owner-Occupied RE Required', 'No',                   'Yes — minimum 51%',          'No'                       ],
    ['SBA Guaranty',               'Up to 85%',            'CDC debenture — 40%',        'Up to 50%'                ],
    ['Typical Processing Time',    '30–90 days',           '45–90 days',                 '36–hour SBA response'     ],
    ['Primary Use Case',           'Acquisitions, RE, WC', 'Owner-occ. commercial RE',   'Quick working capital'    ],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <div>
          <h1 className={`${T.sectionHead} text-xl`}>SBA Program Comparison Matrix</h1>
          <p className="text-xs text-slate-600 mt-0.5">Side-by-side comparison of primary federal lending products — SBA 7(a), 504, and Express</p>
        </div>
      </div>

      <div className="border border-slate-300 overflow-x-auto bg-white">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#0A2540]">
              <th className={T.th + ' w-56'}>Parameter</th>
              <th className={T.th}>SBA 7(a) — General Purpose</th>
              <th className={T.th}>SBA 504 — Real Estate</th>
              <th className={T.th}>SBA Express</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ROWS.map((row, i) => (
              <tr key={i} className={`${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100 transition-colors duration-150`}>
                <td className="py-2.5 px-4 text-xs font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">
                  {row[0]}
                </td>
                {row.slice(1).map((cell, j) => (
                  <td key={j} className="py-2.5 px-4 text-sm tabular-nums text-slate-800 border-r border-slate-100 last:border-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTACT PAGE
// ═══════════════════════════════════════════════════════════
function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    // Verify CAPTCHA if token available
    if (captchaToken) {
      const valid = await verifyTurnstileToken(captchaToken);
      if (!valid) {
        setErrorMsg('CAPTCHA verification failed. Please try again.');
        setStatus('error');
        return;
      }
    }

    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
      setCaptchaToken(null);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="border-b border-slate-300 pb-3">
        <h1 className="font-serif text-xl font-bold text-slate-900">Contact Us</h1>
        <p className="text-xs text-slate-600 mt-0.5">Questions, feedback, or partnership inquiries</p>
      </div>

      {status === 'success' ? (
        <div className="bg-white border border-green-300 border-l-4 border-l-green-600 p-6">
          <p className="text-sm font-semibold text-green-800 mb-1">Message Sent</p>
          <p className="text-sm text-green-700">Thank you for reaching out. We will respond within 1-2 business days.</p>
          <button onClick={() => setStatus(null)} className="mt-4 text-xs font-bold text-[#1B3A6B] uppercase tracking-wide hover:underline cursor-pointer">
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-300 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-300 px-5 py-3">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Send a Message</p>
          </div>
          <div className="p-5 space-y-4">
            {status === 'error' && (
              <div className="flex items-start gap-3 border border-red-400 border-l-4 border-l-red-600 px-4 py-3 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {errorMsg}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="c-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Full Name <span className="text-red-600">*</span></label>
                <input id="c-name" type="text" value={form.name} onChange={update('name')} required className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B]" placeholder="Jane Smith" />
              </div>
              <div>
                <label htmlFor="c-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Email <span className="text-red-600">*</span></label>
                <input id="c-email" type="email" value={form.email} onChange={update('email')} required className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B]" placeholder="jane@company.com" />
              </div>
            </div>
            <div>
              <label htmlFor="c-subject" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Subject</label>
              <select id="c-subject" value={form.subject} onChange={update('subject')} className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B]">
                <option value="">Select a topic...</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Partnership">Partnership / Integration</option>
                <option value="Bug Report">Bug Report</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-msg" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Message <span className="text-red-600">*</span></label>
              <textarea id="c-msg" value={form.message} onChange={update('message')} required rows={5} className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B] resize-none" placeholder="How can we help?" />
            </div>
            <Turnstile onVerify={setCaptchaToken} action="contact" />
            <button type="submit" disabled={status === 'sending' || !form.name.trim() || !form.email.trim() || !form.message.trim()} className={`w-full py-2.5 px-4 font-bold uppercase tracking-wide text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${status === 'sending' || !form.name.trim() || !form.email.trim() || !form.message.trim() ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-[#1B3A6B] text-white hover:bg-[#0A2540] cursor-pointer'}`}>
              {status === 'sending' ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Submit Message'}
            </button>
          </div>
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3">
            <p className="text-[10px] text-slate-500">Or email directly: <a href="mailto:support@clearpathsbaloan.com" className="text-[#1B3A6B] font-medium hover:underline">support@clearpathsbaloan.com</a></p>
          </div>
        </form>
      )}
    </div>
  );
}
