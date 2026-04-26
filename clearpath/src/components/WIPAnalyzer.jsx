// ── WIP Analyzer ──
// Work-in-Progress monitoring for contractor surety underwriting
// Tracks job profitability, contingent liabilities, and bond capacity

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export function WIPAnalyzer({ onBack }) {
  const [jobs, setJobs] = useState([
    { id: 1, name: 'Commercial Building A', totalValue: 2500000, spent: 1800000, earned: 2200000, status: 'In Progress' },
    { id: 2, name: 'Highway Expansion B', totalValue: 3500000, spent: 2100000, earned: 2000000, status: 'At Risk' },
    { id: 3, name: 'Parking Structure C', totalValue: 1200000, spent: 950000, earned: 1100000, status: 'On Track' },
  ]);

  const [selectedJob, setSelectedJob] = useState(null);

  const usd = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const pct = (v) => (v * 100).toFixed(1);

  // Portfolio Summary
  const totalValue = jobs.reduce((sum, job) => sum + job.totalValue, 0);
  const totalSpent = jobs.reduce((sum, job) => sum + job.spent, 0);
  const totalEarned = jobs.reduce((sum, job) => sum + job.earned, 0);
  const totalUnerned = totalValue - totalEarned;
  const atRiskCount = jobs.filter((j) => j.status === 'At Risk').length;

  // WIP Trend data for chart
  const wipTrendData = [
    { month: 'Jan', wip: 800000, earned: 500000 },
    { month: 'Feb', wip: 1200000, earned: 700000 },
    { month: 'Mar', wip: 1500000, earned: 900000 },
    { month: 'Apr', wip: 1800000, earned: 1100000 },
  ];

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
            Work-in-Progress (WIP) Analyzer
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Job-by-job profitability and contingent liability assessment
          </p>
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total WIP', value: usd(totalSpent), hint: 'Costs incurred to date' },
          { label: 'Earned Revenue', value: usd(totalEarned), hint: 'Billings recognized' },
          { label: 'Unearned WIP', value: usd(totalUnerned), hint: 'Remaining work to complete' },
          {
            label: 'At-Risk Jobs',
            value: atRiskCount,
            hint: `${atRiskCount} job(s) requiring attention`,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-300 rounded-sm p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              {kpi.label}
            </p>
            <p className="text-lg font-bold text-slate-900">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.hint}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Job List */}
        <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-300 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Active Jobs
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {jobs.map((job) => {
              const progress = (job.earned / job.totalValue) * 100;
              const profitMargin = ((job.earned - job.spent) / job.earned * 100).toFixed(1);
              const statusColor =
                job.status === 'On Track'
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : job.status === 'At Risk'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-blue-700 bg-blue-50 border-blue-200';

              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                    selectedJob === job.id ? 'bg-blue-50 border-l-4 border-l-[#1B3A6B]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900">{job.name}</p>
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-2 py-1 border rounded-sm ${statusColor}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{pct(progress)}% complete</span>
                      <span className={`font-semibold ${profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin}% margin
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${profitMargin > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Job value */}
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{usd(job.earned)}</span> of{' '}
                    {usd(job.totalValue)} earned
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* WIP Trend Chart */}
        <div className="bg-white border border-slate-300 rounded-sm p-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
            WIP vs. Earned Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={wipTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => usd(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="wip"
                stroke="#EF4444"
                strokeWidth={2}
                name="Costs (WIP)"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="earned"
                stroke="#10B981"
                strokeWidth={2}
                name="Earned Revenue"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Job Detail */}
      {selectedJob && (
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
          {jobs
            .filter((j) => j.id === selectedJob)
            .map((job) => {
              const margin = job.earned - job.spent;
              const marginPct = ((margin / job.earned) * 100).toFixed(1);

              return (
                <div key={job.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{job.name}</h3>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="text-slate-500 hover:text-slate-700 text-xs font-bold uppercase"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-600">Contract Value</p>
                      <p className="font-bold text-slate-900">{usd(job.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Costs to Date</p>
                      <p className="font-bold text-slate-900">{usd(job.spent)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Earned Revenue</p>
                      <p className="font-bold text-slate-900">{usd(job.earned)}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-sm p-2 text-xs space-y-1.5 border border-blue-300">
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-900">{marginPct}% profit margin</span> on earned revenue
                    </p>
                    {job.status === 'At Risk' && (
                      <p className="text-amber-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Contingent liability review recommended
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Assessment Summary */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 text-sm space-y-2">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Bond Capacity Assessment
        </h3>
        <p className="text-slate-700">
          Current portfolio WIP of <strong>{usd(totalSpent)}</strong> with <strong>{pct(totalEarned / totalValue)}</strong> percentage earned suggests adequate job performance. Monitor the{' '}
          <strong>{atRiskCount} at-risk job(s)</strong> for schedule and cost contingencies.
        </p>
      </div>
    </div>
  );
}

export default WIPAnalyzer;
