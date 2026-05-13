// ── As-Allowed Spreading Engine ──
// Bond-specific financial analysis using SBA 13(g)(2) methodologies
// Supports contractor surety underwriting with industry-adjusted metrics

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, AlertCircle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export function SpreadingEngine({ onBack }) {
  const [financialData, setFinancialData] = useState({
    grossRevenue: '0',
    cogs: '0',
    operatingExpenses: '0',
  });

  const [results, setResults] = useState(null);

  const handleCalculate = () => {
    const gross = parseFloat(financialData.grossRevenue.replace(/,/g, '')) || 0;
    const cogs = parseFloat(financialData.cogs.replace(/,/g, '')) || 0;
    const opex = parseFloat(financialData.operatingExpenses.replace(/,/g, '')) || 0;

    const grossProfit = gross - cogs;
    const ebitda = gross - cogs - opex;
    const profitMargin = gross > 0 ? ((ebitda / gross) * 100).toFixed(1) : 0;

    setResults({
      grossRevenue: gross,
      grossProfit,
      ebitda,
      profitMargin,
      healthScore: ebitda > 0 && profitMargin > 5 ? 'Strong' : ebitda > 0 ? 'Adequate' : 'Weak',
    });
  };

  const chartData = results
    ? [
        { category: 'Revenue', value: results.grossRevenue, fill: '#1B3A6B' },
        { category: 'Gross Profit', value: results.grossProfit, fill: '#3B82F6' },
        { category: 'EBITDA', value: results.ebitda, fill: '#10B981' },
      ]
    : [];

  const usd = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const followUpItems = results
    ? [
        results.profitMargin < 5 ? 'Ask for margin support and normalization detail before relying on EBITDA.' : 'Margin support looks stronger, so follow-up can focus on sustainability and trend consistency.',
        results.ebitda <= 0 ? 'Treat this file as high-friction for bond capacity until earnings support improves.' : 'EBITDA is positive, which gives the underwriter a cleaner starting point for capacity discussion.',
        results.grossProfit <= 0 ? 'Review contract mix and direct cost treatment before moving the file forward.' : 'Gross profit is present, but underwriter follow-up should still test job-level quality and recurring cost pressure.',
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-300 pb-3">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 p-1 hover:bg-slate-100 rounded transition-colors"
          aria-label="Back to Surety Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-serif text-xl font-bold text-slate-900">
            As-Allowed Spreading Engine
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Normalize contractor financials before full review using a simple as-allowed underwriting lens.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-blue-950">What this helps you catch</p>
          <p className="text-blue-900">
            Use this step to spot thin operating margins, weak earnings support, and financial follow-up items before the contractor file reaches full underwriting review.
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Input Section */}
        <div className="bg-white border border-slate-300 rounded-sm p-4 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Financial Data Entry
          </h2>
          <p className="text-xs text-slate-600 -mt-2">
            Enter the numbers you have today to convert raw financials into a cleaner underwriter-facing starting point.
          </p>

          {/* Input Fields */}
          <div className="space-y-3">
            {[
              { key: 'grossRevenue', label: 'Gross Revenue (Annual)', hint: 'Total sales before COGS' },
              { key: 'cogs', label: 'Cost of Goods Sold', hint: 'Direct materials + labor' },
              { key: 'operatingExpenses', label: 'Operating Expenses', hint: 'Rent, utilities, overhead' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-semibold">
                    $
                  </span>
                  <input
                    type="text"
                    value={financialData[field.key]}
                    onChange={(e) =>
                      setFinancialData({
                        ...financialData,
                        [field.key]: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 pl-7 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] hover:border-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{field.hint}</p>
              </div>
            ))}
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="w-full bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-bold py-3 px-4 rounded-sm uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" /> Calculate Spreading
          </button>

          {/* Methodology Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs space-y-1">
            <p className="font-semibold text-slate-700">Spreading Methodology:</p>
            <ul className="space-y-1 text-slate-600 ml-3 list-disc">
              <li>Revenue — Gross receipts, less returns & allowances</li>
              <li>COGS — Direct materials, direct labor, allocated overhead</li>
              <li>EBITDA — Operating income available to support bond capacity discussions</li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {results ? (
            <>
              {/* Key Metrics */}
              <div className="bg-[#0A2540] border border-[#1B3A6B] rounded-sm p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                    Gross Profit
                  </p>
                  <p className="text-xl font-bold text-white tabular-nums">{usd(results.grossProfit)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {((results.grossProfit / results.grossRevenue) * 100).toFixed(1)}% of revenue
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                    EBITDA
                  </p>
                  <p className="text-xl font-bold text-white tabular-nums">{usd(results.ebitda)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {results.profitMargin}% margin
                  </p>
                </div>
              </div>

              {/* Health Score */}
              <div
                className={`border-l-4 rounded-sm p-4 ${
                  results.healthScore === 'Strong'
                    ? 'bg-green-50 border-l-green-600 text-green-900'
                    : results.healthScore === 'Adequate'
                    ? 'bg-amber-50 border-l-amber-600 text-amber-900'
                    : 'bg-red-50 border-l-red-600 text-red-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold mb-1">Financial Health: {results.healthScore}</p>
                    <p>
                      {results.healthScore === 'Strong'
                        ? 'Contractor demonstrates stronger cash generation support, which gives the underwriter a cleaner basis for bond capacity follow-up.'
                        : results.healthScore === 'Adequate'
                        ? 'Contractor profitability appears workable, but the file still warrants closer follow-up around contingent liabilities and sustainability.'
                        : 'Profitability looks thin for comfortable bond support, so this file should move forward with tighter underwriting follow-up.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-300 rounded-sm p-4">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                  Underwriter Follow-Up
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  {followUpItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-slate-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chart */}
              <div className="bg-white border border-slate-300 rounded-sm p-4">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                  Financial Waterfall
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => usd(v)} />
                    <Bar dataKey="value" fill="#1B3A6B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 text-center">
              <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-700 font-medium">Enter financial data to view analysis</p>
              <p className="text-xs text-slate-600 mt-1">
                Results will show gross profit, EBITDA, and where the file may need more underwriting attention
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpreadingEngine;
