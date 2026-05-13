// ── WIP Analyzer ──
// Work-in-Progress monitoring for contractor surety underwriting
// Tracks job profitability, contingent liabilities, and bond capacity

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, AlertTriangle, CheckCircle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const SAMPLE_JOBS = [
  { id: 1, name: 'Commercial Building A', totalValue: 2500000, spent: 1800000, earned: 2200000, status: 'In Progress' },
  { id: 2, name: 'Highway Expansion B', totalValue: 3500000, spent: 2100000, earned: 2000000, status: 'At Risk' },
  { id: 3, name: 'Parking Structure C', totalValue: 1200000, spent: 950000, earned: 1100000, status: 'On Track' },
];

export function WIPAnalyzer({ onBack }) {
  const [jobs, setJobs] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [newJob, setNewJob] = useState({
    name: '',
    totalValue: '',
    spent: '',
    earned: '',
    status: 'In Progress',
  });

  const usd = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const pct = (v) => (v * 100).toFixed(1);
  const toNumber = (value) => Number(String(value).replace(/[^0-9.-]/g, '')) || 0;

  const handleNewJobChange = (event) => {
    const { name, value } = event.target;
    setNewJob((current) => ({ ...current, [name]: value }));
  };

  const handleAddJob = (event) => {
    event.preventDefault();
    const job = {
      id: Date.now(),
      name: newJob.name.trim() || `Job ${jobs.length + 1}`,
      totalValue: toNumber(newJob.totalValue),
      spent: toNumber(newJob.spent),
      earned: toNumber(newJob.earned),
      status: newJob.status,
    };

    if (job.totalValue <= 0) return;

    setJobs((current) => [...current, job]);
    setSelectedJob(job.id);
    setNewJob({ name: '', totalValue: '', spent: '', earned: '', status: 'In Progress' });
  };

  const handleRemoveJob = (id) => {
    setJobs((current) => current.filter((job) => job.id !== id));
    if (selectedJob === id) setSelectedJob(null);
  };

  const handleLoadSamples = () => {
    setJobs(SAMPLE_JOBS);
    setSelectedJob(SAMPLE_JOBS[0].id);
  };

  // Portfolio Summary
  const totalValue = jobs.reduce((sum, job) => sum + job.totalValue, 0);
  const totalSpent = jobs.reduce((sum, job) => sum + job.spent, 0);
  const totalEarned = jobs.reduce((sum, job) => sum + job.earned, 0);
  const totalUnerned = Math.max(totalValue - totalEarned, 0);
  const atRiskCount = jobs.filter((j) => j.status === 'At Risk').length;
  const marginRiskCount = jobs.filter((job) => job.earned > 0 && ((job.earned - job.spent) / job.earned) < 0.05).length;
  const concentrationShare = totalValue > 0 ? Math.max(...jobs.map((job) => job.totalValue / totalValue), 0) : 0;
  const reviewFlags = jobs.length > 0
    ? [
        atRiskCount > 0
          ? `${atRiskCount} job${atRiskCount === 1 ? '' : 's'} already show an explicit at-risk designation and should be first in follow-up order.`
          : 'No jobs are manually tagged at risk yet, so the file can move into margin and concentration review.',
        marginRiskCount > 0
          ? `${marginRiskCount} job${marginRiskCount === 1 ? '' : 's'} show thin margins below a 5% cushion, which increases fade sensitivity.`
          : 'Current entered jobs do not show thin-margin pressure below the 5% cushion threshold.',
        concentrationShare >= 0.5
          ? `The largest job represents ${pct(concentrationShare)} of entered contract value, so concentration risk deserves direct underwriter follow-up.`
          : 'No single job dominates the current WIP mix, which reduces concentration pressure in the first pass.',
      ]
    : [];

  // WIP Trend data for chart
  const wipTrendData = jobs.map((job, index) => ({
    month: `Job ${index + 1}`,
    wip: job.spent,
    earned: job.earned,
  }));

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
            Pressure-test open work before full review so job stress and fade risk surface earlier.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-950">What this helps you catch</p>
          <p className="text-amber-900">
            Use this review to identify jobs that may be hiding profit fade, backlog concentration, or contingent liability stress before the file reaches full underwriting time.
          </p>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white border border-slate-300 rounded-sm p-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Review Flags</h2>
          <p className="text-xs text-slate-600 mt-1 mb-3">This is the first-pass WIP story an underwriter or analyst would likely care about.</p>
          <ul className="space-y-2 text-xs text-slate-700">
            {reviewFlags.map((flag) => (
              <li key={flag} className="flex items-start gap-2">
                <span className="mt-0.5 text-slate-400">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {/* User-entered job input */}
      <form onSubmit={handleAddJob} className="bg-white border border-slate-300 rounded-sm p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Add WIP Job</h2>
            <p className="text-xs text-slate-600 mt-0.5">Enter contract-level data to see which jobs likely deserve follow-up before submission.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex min-h-11 items-center gap-2 border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Add Sample Jobs
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2540] disabled:opacity-60"
              disabled={!newJob.totalValue}
            >
              <Plus className="w-4 h-4" />
              Add Job
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          <label className="md:col-span-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">Job name</span>
            <input
              name="name"
              value={newJob.name}
              onChange={handleNewJobChange}
              className="w-full border border-slate-400 px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              placeholder="Municipal Library"
            />
          </label>
          <label>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">Contract value</span>
            <input
              name="totalValue"
              inputMode="decimal"
              value={newJob.totalValue}
              onChange={handleNewJobChange}
              className="w-full border border-slate-400 px-3 py-2 text-sm tabular-nums focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              placeholder="2500000"
              required
            />
          </label>
          <label>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">Costs to date</span>
            <input
              name="spent"
              inputMode="decimal"
              value={newJob.spent}
              onChange={handleNewJobChange}
              className="w-full border border-slate-400 px-3 py-2 text-sm tabular-nums focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              placeholder="1500000"
            />
          </label>
          <label>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">Earned revenue</span>
            <input
              name="earned"
              inputMode="decimal"
              value={newJob.earned}
              onChange={handleNewJobChange}
              className="w-full border border-slate-400 px-3 py-2 text-sm tabular-nums focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              placeholder="1700000"
            />
          </label>
          <label>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">Status</span>
            <select
              name="status"
              value={newJob.status}
              onChange={handleNewJobChange}
              className="w-full border border-slate-400 px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            >
              <option>In Progress</option>
              <option>On Track</option>
              <option>At Risk</option>
            </select>
          </label>
        </div>
      </form>

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
            {jobs.length === 0 && (
              <div className="p-5 text-sm text-slate-600">
                No jobs entered yet. Add current contract data above to start a job-by-job follow-up review.
              </div>
            )}
            {jobs.map((job) => {
              const progress = job.totalValue > 0 ? job.earned / job.totalValue : 0;
              const profitMargin = job.earned > 0
                ? ((job.earned - job.spent) / job.earned * 100).toFixed(1)
                : '0.0';
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide px-2 py-1 border rounded-sm ${statusColor}`}
                      >
                        {job.status}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveJob(job.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            handleRemoveJob(job.id);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Remove ${job.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{pct(progress)}% complete</span>
                      <span className={`font-semibold ${Number(profitMargin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin}% margin
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${Number(profitMargin) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(progress * 100, 100)}%` }}
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
          {jobs.length > 0 ? (
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
          ) : (
            <div className="flex h-[280px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
              Add jobs to render the WIP trend.
            </div>
          )}
        </div>
      </div>

      {/* Job Detail */}
      {selectedJob && (
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
          {jobs
            .filter((j) => j.id === selectedJob)
            .map((job) => {
              const margin = job.earned - job.spent;
              const marginPct = job.earned > 0 ? ((margin / job.earned) * 100).toFixed(1) : '0.0';

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
          {jobs.length > 0 ? (
            <>
              Current portfolio WIP of <strong>{usd(totalSpent)}</strong> with <strong>{pct(totalValue > 0 ? totalEarned / totalValue : 0)}%</strong> earned suggests live job performance is ready for review. Monitor the{' '}
              <strong>{atRiskCount} at-risk job(s)</strong> for schedule and cost contingencies.
            </>
          ) : (
            'Add current jobs above to generate a bond capacity assessment with green pass/fail cues.'
          )}
        </p>
      </div>
    </div>
  );
}

export default WIPAnalyzer;
