/**
 * Surety Bond Calculator Demo
 *
 * Component for surety bond analysis and risk assessment.
 *
 * Features:
 * - Financial data input
 * - Decimal arithmetic analysis
 * - Risk scoring
 * - Premium calculation
 */

import React, { useState } from 'react';
import { SuretyCalculator } from '../services/suretyCalculator.js';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export function SuretyCalculatorDemo() {
  const [formData, setFormData] = useState({
    revenue: 500000,
    expenses: 400000,
    assets: 300000,
    liabilities: 150000,
    businessAge: 5,
    industryType: 'manufacturing',
  });

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const calculator = new SuretyCalculator();
      const result = calculator.analyzeApplication(formData, {
        businessAge: formData.businessAge,
        industryType: formData.industryType,
      });
      setAnalysis(result);
    } catch (error) {
      alert('Analysis failed: ' + error.message);
    }
    setLoading(false);
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getRiskBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Surety Bond Calculator</h1>
          </div>
          <p className="text-slate-400">Precision-based financial analysis with decimal arithmetic</p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Financial Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Annual Revenue</label>
              <input
                type="number"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Annual Expenses</label>
              <input
                type="number"
                value={formData.expenses}
                onChange={(e) => setFormData({ ...formData, expenses: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Total Assets</label>
              <input
                type="number"
                value={formData.assets}
                onChange={(e) => setFormData({ ...formData, assets: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Total Liabilities</label>
              <input
                type="number"
                value={formData.liabilities}
                onChange={(e) => setFormData({ ...formData, liabilities: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Business Age (years)</label>
              <input
                type="number"
                value={formData.businessAge}
                onChange={(e) => setFormData({ ...formData, businessAge: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
              <select
                value={formData.industryType}
                onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              >
                <option value="construction">Construction</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="service">Service</option>
                <option value="retail">Retail</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Analyzing...' : 'Analyze Application'}
          </button>
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Risk Score Card */}
            <div className={`rounded-lg border-2 p-8 ${getRiskColor(analysis.riskScore.score)}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Risk Assessment</h2>
                <span className={`px-4 py-2 rounded-full text-lg font-semibold ${getRiskBadge(analysis.riskScore.score)}`}>
                  {analysis.riskScore.rating}
                </span>
              </div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-2">
                {analysis.riskScore.score}/100
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 transition-all duration-300"
                  style={{ width: `${analysis.riskScore.score}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Financial Summary</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue:</span>
                    <span className="font-mono text-white">${analysis.summary.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expenses:</span>
                    <span className="font-mono text-white">${analysis.summary.expenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between font-semibold">
                    <span className="text-slate-300">Net Income:</span>
                    <span className="font-mono text-green-400">${analysis.summary.netIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profit Margin:</span>
                    <span className="font-mono text-white">{analysis.summary.profitMargin.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Debt-to-Equity:</span>
                    <span className="font-mono text-white">{analysis.summary.debtToEquity.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              {/* Premium & Loss Ratio */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Premium & Pricing</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Annual Premium</p>
                    <p className="text-3xl font-bold text-green-400">{analysis.premium.formatted}</p>
                  </div>
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-sm text-slate-400 mb-1">Loss Ratio</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-white">{analysis.lossRatio.ratio.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        analysis.lossRatio.interpretation === 'Profitable' ? 'bg-green-900 text-green-300' :
                        analysis.lossRatio.interpretation === 'Acceptable' ? 'bg-blue-900 text-blue-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {analysis.lossRatio.interpretation}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spread Analysis */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">As-Allowed Spreading Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Reported Financials</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Revenue:</span>
                      <span className="text-white">${analysis.spread.original.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expenses:</span>
                      <span className="text-white">${analysis.spread.original.expenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
                      <span className="text-slate-300">Net Income:</span>
                      <span className="text-green-400">${analysis.spread.original.netIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">As-Allowed (Adjusted)</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Revenue:</span>
                      <span className="text-white">${analysis.spread.asAllowed.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expenses:</span>
                      <span className="text-white">${analysis.spread.asAllowed.expenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
                      <span className="text-slate-300">Net Income:</span>
                      <span className="text-green-400">${analysis.spread.asAllowed.netIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
                <p>Revenue adjusted to {100 + analysis.spread.adjustments.revenueAdjustment}% | Expenses adjusted to {100 + analysis.spread.adjustments.expenseAdjustment}%</p>
              </div>
            </div>

            {/* Risk Factors */}
            {analysis.riskScore.factors.length > 0 && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Risk Factors</h3>
                </div>
                <div className="space-y-3">
                  {analysis.riskScore.factors.map((factor, i) => (
                    <div key={i} className="bg-slate-700 rounded p-4 border-l-4 border-yellow-500">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{factor.factor}</h4>
                          <p className="text-sm text-slate-300 mt-1">{factor.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          factor.severity === 'high' ? 'bg-red-900 text-red-300' :
                          factor.severity === 'moderate' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-blue-900 text-blue-300'
                        }`}>
                          {factor.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {analysis.riskScore.factors.length === 0 && (
              <div className="bg-green-900 border border-green-700 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h4 className="font-semibold text-green-100">Strong Financial Profile</h4>
                    <p className="text-sm text-green-200 mt-1">No significant risk factors identified</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>All calculations use Decimal.js for exact precision • No floating-point errors</p>
        </div>
      </div>
    </div>
  );
}

export default SuretyCalculatorDemo;
