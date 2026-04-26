import React, { useState, useMemo } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import {
  Shield, FileText, Activity, AlertCircle,
  Download, Clock, Menu, X,
  Layers, CheckSquare, Info, MessageSquare,
  Landmark, Calculator, Loader2, Copy, Check,
  Factory, Briefcase, Users, Printer, ExternalLink,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// TODO: UI/UX enhancements (planned for Phase 2)
// import TermSheetTemplate from './components/TermSheetTemplate';
// import GenerativeFeatures from './components/GenerativeFeatures';
// import PremiumForm from './components/PremiumForm';
// import { exportTermSheetPDF, exportTermSheetHTML, printTermSheet } from './utils/pdfExport';

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
    // TODO: Implement print functionality (Phase 2)
    window.print();
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export (Phase 2)
    alert('PDF export coming in Phase 2');
  };

  const handleExportHTML = () => {
    // TODO: Implement HTML export (Phase 2)
    alert('HTML export coming in Phase 2');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 overflow-y-auto">
      <div className="bg-[#0A2540] border-b border-[#1B3A6B] sticky top-0 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-white text-xs font-bold uppercase tracking-wide">Term Sheet Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintTermSheet}
            className={T.btnSecondary + ' text-xs px-3 py-1.5'}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleExportPDF} className={T.btnPrimary + ' text-xs px-3 py-1.5'}>
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleExportHTML} className={T.btnSecondary + ' text-xs px-3 py-1.5'}>
            <Download className="w-3.5 h-3.5" /> HTML
          </button>
          <button onClick={onClose} className="ml-2 text-slate-300 hover:text-white transition-colors duration-150 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-white overflow-y-auto">
        <div className="max-w-8.5in mx-auto p-8">
          {/* TODO: Render TermSheetTemplate (Phase 2 - Premium Form Redesign) */}
          <div className="bg-slate-50 p-8 rounded border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Term Sheet Preview</h3>
            <p className="text-slate-600">Professional term sheet template coming in Phase 2 redesign.</p>
          </div>
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

  const nav = (p) => { setPage(p); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const NAV_ITEMS = [
    { id: 'home',       label: 'Overview'              },
    { id: 'calculator', label: 'Amortization Terminal' },
    { id: 'screener',   label: 'Eligibility Screener'  },
    { id: 'checklist',  label: 'Document Checklist'    },
    { id: 'compare',    label: 'Program Comparison'    },
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
          >
            <div className="w-6 h-6 bg-white flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-[#0A2540]" />
            </div>
            <span className="font-serif text-sm font-bold text-white">ClearPath SBA</span>
            <span className="hidden sm:block text-slate-400 text-[10px] font-semibold uppercase tracking-wide ml-1 border-l border-[#1B3A6B] pl-2">
              SBA SOP 50 10 7 · Free Platform
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            {NAV_ITEMS.map(item => <NavLink key={item.id} {...item} />)}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-300 hover:text-white transition-colors duration-150 cursor-pointer p-1"
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
        {page === 'calculator' && <AmortizationTerminal nav={nav} />}
        {page === 'screener'   && <EligibilityScreener nav={nav} />}
        {page === 'checklist'  && <DocumentChecklist />}
        {page === 'compare'    && <ProgramComparison />}
      </main>

      <SpeedInsights />

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-300 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mt-6 pt-5 border-t border-slate-200">
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
      desc: 'Model loan amortization, calculate debt service, apply FY26 manufacturer fee waivers, and compile formal term sheets.',
      action: 'Open Terminal',
      icon: Activity,
    },
    {
      n: '02', id: 'screener',
      title: 'Eligibility Screener',
      desc: 'Screen applicants against SBA SOP 50 10 7 qualification criteria prior to formal underwriting submission.',
      action: 'Screen Applicant',
      icon: Shield,
    },
    {
      n: '03', id: 'checklist',
      title: 'Document Checklist',
      desc: 'Generate entity- and transaction-specific document requirement matrices with inline regulatory definitions.',
      action: 'Build Checklist',
      icon: CheckSquare,
    },
    {
      n: '04', id: 'compare',
      title: 'Program Comparison',
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

      {/* FY26 Regulatory Alert */}
      <div className="bg-white border border-amber-400 border-l-4 border-l-amber-600 px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-0.5">
            Regulatory Notice — FY2026 Fee Waiver
          </p>
          <p className="text-sm text-slate-800">
            NAICS 31–33 (Manufacturing) borrowers qualify for elimination of SBA upfront guaranty fees under FY26 appropriations.{' '}
            <strong className="text-slate-900">Authorization expires September 30, 2026.</strong>
          </p>
        </div>
        <button onClick={() => nav('calculator')} className={T.btnPrimary + ' shrink-0'}>
          Model Fee Exemption <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Module Index */}
      <section>
        <h1 className={`${T.sectionHead} mb-3`}>Platform Modules</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-300 border border-slate-300 overflow-hidden">
          {MODULES.map((m) => (
            <div key={m.id} className="bg-white p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide tabular-nums">{m.n}</span>
                <m.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h2 className="font-serif text-sm font-bold text-slate-900 mb-1">{m.title}</h2>
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

function AmortizationTerminal({ nav }) {
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
    console.log('handleCompile called', { prog, amount, years, rateStr });
    setGenerating(true);
    setError(null);
    setGenerateStatus(null);
    try {
      const progLabel = PROGRAMS.find(p => p.id === prog)?.label;
      const dscr = monthly > 0 ? 1.25 : 0; // Default DSCR
      console.log('About to call fetchAI with:', { progLabel });
      const data = await fetchAI(
        `Generate underwriting assessment for SBA loan:\n\nParameters:\nProgram: ${progLabel}\nPrincipal: $${amount}\nRate: ${rateStr}%\nTerm: ${years} years\nMonthly Debt Service: ${usd2(monthly)}\nFY26 Manufacturer Waiver: ${mfr ? 'APPLIED' : 'Not applied'}\n\nReturn JSON: { narrative (2-3 sentence executive summary), covenants_assessment (DSCR minimum recommended), collateral_summary (recommended collateral types) }`,
        'Commercial banking underwriter. Return valid JSON only.',
        true
      );

      const origFee = principal * (prog.includes('7a') ? 0.0275 : prog === '504' ? 0.025 : 0.02);
      const guarantyFee = mfr ? 0 : (prog.includes('7a') ? principal * 0.008 : principal * 0.006);
      const totalFees = origFee + guarantyFee;

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
          dscr: typeof data.covenants_assessment === 'number' ? data.covenants_assessment : parseFloat(String(data.covenants_assessment || '1.25').match(/\d+\.?\d*/)?.[0] || '1.25')
        },
        equity: {
          required_pct: 10,
          required_amount: principal * 0.1
        },
        collateral: (() => {
          let summary = data.collateral_summary || 'Commercial real estate';
          if (typeof summary === 'object') {
            summary = 'Commercial real estate'; // Default if API returns object
          } else {
            summary = String(summary);
          }
          return summary.split(',').map(s => s.trim()).filter(s => s && s !== '[object Object]');
        })(),
        covenants: {
          dscr_min: typeof data.covenants_assessment === 'number' ? data.covenants_assessment : parseFloat(String(data.covenants_assessment || '1.25').match(/\d+\.?\d*/)?.[0] || '1.25'),
          current_ratio_min: 1.2,
          debt_ratio_max: 2.0,
          testing_frequency: 'Annual'
        },
        fees: {
          origination_pct: prog.includes('7a') ? 2.75 : prog === '504' ? 2.5 : 2.0,
          origination: origFee,
          guaranty_pct: mfr ? 0 : (prog.includes('7a') ? 0.8 : 0.6),
          guaranty: guarantyFee,
          waiver_applicable: mfr,
          waiver_savings: mfr ? guarantyFee : 0,
          total_fees: totalFees
        },
        narrative: data.narrative || 'Structurally sound commercial expansion opportunity with strong market fundamentals.',
        effective_date: new Date().toLocaleDateString(),
        maturity_date: new Date(new Date().setFullYear(new Date().getFullYear() + parseInt(years))).toLocaleDateString()
      };

      console.log('Setting term sheet data and opening modal', { termSheetData });
      setTermSheetData(termSheetData);
      setGenerateStatus('success');
      console.log('About to call setModalOpen(true)');
      setModalOpen(true);
      console.log('setModalOpen called');
    } catch (e) {
      console.error('Error in handleCompile:', e);
      setError(e.message);
      setGenerateStatus('error');
    }
    finally { setGenerating(false); }
  };

  const scheduleRows = useMemo(() => {
    const rows = [];
    let bal = principal;
    for (let i = 1; i <= Math.min(n, 12); i++) {
      const int = bal * mr, pri = monthly - int; bal = Math.max(0, bal - pri);
      rows.push({ m: i, pay: monthly, pri, int, bal });
    }
    return rows;
  }, [principal, mr, monthly, n]);

  const chartData = useMemo(() => {
    const data = [];
    let bal = principal;
    let cumPrincipal = 0;
    let cumInterest = 0;
    const step = Math.max(1, Math.floor(n / 120)); // Max 120 data points
    for (let i = 1; i <= n; i += step) {
      for (let j = i; j <= Math.min(i + step - 1, n); j++) {
        const int = bal * mr, pri = monthly - int;
        cumPrincipal += pri;
        cumInterest += int;
        bal = Math.max(0, bal - pri);
      }
      data.push({
        month: i,
        principal: Math.round(cumPrincipal),
        interest: Math.round(cumInterest),
        balance: Math.round(bal)
      });
    }
    return data;
  }, [principal, mr, monthly, n]);

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

        <div className="grid lg:grid-cols-12 gap-4">

          {/* ── LEFT COLUMN: Inputs ── */}
          <div className="lg:col-span-5 space-y-3">

            {/* TODO: Generative Features Panel (Phase 2 - API Feature Elevation) */}
            {/* Placeholder: Extract Parameters and Compile buttons */}
            <div className="space-y-2">
              <button onClick={handleExtract} disabled={extracting} className={T.btnPrimary + ' w-full'}>
                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                {extracting ? 'Extracting...' : 'Extract Parameters'}
              </button>
              <button onClick={handleCompile} disabled={generating || !amount} className={T.btnPrimary + ' w-full'}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Compile Term Sheet'}
              </button>
            </div>

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

            {/* Amortization Charts */}
            <div className="border border-slate-300 overflow-hidden bg-white">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Amortization Visualization</span>
              </div>
              <div className="p-4 space-y-6">
                {/* Principal vs Interest */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Cumulative Principal vs Interest</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -8 }} />
                      <YAxis label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                      <Legend />
                      <Area type="monotone" dataKey="principal" stackId="1" stroke="#1B3A6B" fill="#3B82F6" name="Principal Paid" />
                      <Area type="monotone" dataKey="interest" stackId="1" stroke="#64748B" fill="#CBD5E1" name="Interest Paid" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Balance Remaining */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Remaining Balance</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -8 }} />
                      <YAxis label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="balance" stroke="#1B3A6B" strokeWidth={2} dot={false} name="Outstanding Balance" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

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
                  <button onClick={copyAll} className={T.btnSecondary + ' text-xs py-1.5 px-3'}>
                    {copied === 'all' ? <Check className="w-3.5 h-3.5 text-[#1B3A6B]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'all' ? 'Copied' : 'Copy Data'}
                  </button>
                  <button onClick={exportCSV} className={T.btnSecondary + ' text-xs py-1.5 px-3'}>
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

              <div className="border-t border-slate-200 p-4">
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

          <button onClick={reset} className={T.btnSecondary}>New Inquiry</button>
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Step indicator */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-2">
          <span>Eligibility Screener — SBA SOP 50 10 7</span>
          <span className="tabular-nums">Step {current + 1} / {SCREENER_QUESTIONS.length}</span>
        </div>
        {/* Segmented step bar */}
        <div className="flex gap-px">
          {SCREENER_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 transition-colors duration-150 ${i <= current ? 'bg-[#1B3A6B]' : 'bg-slate-300'}`}
            />
          ))}
        </div>
      </div>

      <div className="border border-slate-300 overflow-hidden bg-white">
        {/* Question header */}
        <div className="bg-slate-50 border-b border-slate-300 px-5 py-4">
          <h2 className="font-serif text-base font-bold text-slate-900">{q.q}</h2>
          {q.hint && (
            <div className="flex items-start gap-2 mt-3 bg-white border border-slate-300 p-3">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">{q.hint}</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="divide-y divide-slate-200">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left px-5 py-3.5 flex items-center gap-3 text-sm transition-colors duration-150 cursor-pointer
                ${selected === opt.value
                  ? 'bg-[#0A2540] text-white'
                  : 'bg-white text-slate-800 hover:bg-slate-50'
                }`}
            >
              <div className={`w-3.5 h-3.5 border-2 shrink-0 flex items-center justify-center
                ${selected === opt.value ? 'border-white' : 'border-slate-400'}`}
              >
                {selected === opt.value && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
              <span className="font-medium">{opt.label}</span>
              {opt.flag === 'red'    && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-50 border border-red-300 px-1.5 py-0.5">Disqualifying</span>}
              {opt.flag === 'yellow' && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5">Conditional</span>}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="bg-slate-50 border-t border-slate-300 px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => { if (current > 0) { setCurrent(c => c - 1); setSelected(answers[SCREENER_QUESTIONS[current - 1].id] || ''); } }}
            disabled={current === 0}
            className={T.btnGhost + ' disabled:opacity-0'}
          >
            Previous
          </button>
          <button
            onClick={advance}
            disabled={!selected}
            className={T.btnPrimary}
          >
            {current + 1 === SCREENER_QUESTIONS.length ? 'Submit for Analysis' : 'Continue'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
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
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={T.label} htmlFor="loan-type">Transaction Classification</label>
            <select
              id="loan-type"
              value={loanType}
              onChange={e => { setLoanType(e.target.value); setExplaining(null); setChecked(new Set()); }}
              className={T.input}
            >
              <option value="">Select transaction type…</option>
              <option value="working_capital">Working Capital / Equipment Acquisition</option>
              <option value="real_estate">Commercial Real Estate</option>
              <option value="acquisition">Business Acquisition</option>
            </select>
          </div>
          <div>
            <label className={T.label} htmlFor="entity-type">Borrowing Entity Structure</label>
            <select
              id="entity-type"
              value={entity}
              onChange={e => { setEntity(e.target.value); setExplaining(null); setChecked(new Set()); }}
              className={T.input}
            >
              <option value="">Select entity type…</option>
              <option value="LLC">Limited Liability Company (LLC)</option>
              <option value="Corp">S-Corporation / C-Corporation</option>
              <option value="SoleProp">Sole Proprietorship</option>
            </select>
          </div>
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
                  className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${checked.has(item) ? 'bg-[#1B3A6B] border-[#1B3A6B]' : 'bg-white border-slate-400 group-hover:border-slate-600'}`}>
                      {checked.has(item) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-150 ${checked.has(item) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {item}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); explain(item); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-bold text-slate-700 uppercase tracking-wide bg-white border border-slate-300 hover:border-slate-500 px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
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

      <div className="grid md:grid-cols-2 gap-4">
      </div>
    </div>
  );
}
