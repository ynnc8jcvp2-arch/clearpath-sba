/**
 * Surety Analysis Platform
 *
 * Demonstrates the complete surety underwriting workflow:
 * 1. Financial data input (spreadsheet or manual)
 * 2. WIP schedule analysis (for contractors)
 * 3. As-allowed spreading calculation
 * 4. Combined risk assessment
 * 5. Underwriting recommendation
 *
 * Integrates with:
 * - /api/v1/surety/analyze endpoint
 * - Hardened security middleware (RBAC, audit logging)
 * - SpreadingEngine service (as-allowed adjustments)
 * - WIPAnalyzer service (bond exposure)
 */

import React, { useState } from 'react';
import { getAuthToken } from '../../../shared/utils/supabaseClient.js';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  AlertTriangle,
  Briefcase,
  Building2
} from 'lucide-react';

const DEFAULT_FINANCIAL_DATA = {
  revenue: 2500000,
  grossProfit: 1000000,
  expenses: 600000,
  netIncome: 400000,
  liabilities: { total: 800000 },
  equity: 1200000,
  assets: 2000000,
  businessAge: 7,
  industryType: 'General Contracting'
};

const DEFAULT_WIP_DATA = {
  contracts: [
    {
      id: 'CONTRACT-001',
      name: 'Office Building Addition',
      contractValue: 1500000,
      costToDate: 750000,
      billedToDate: 750000,
      percentComplete: 50,
      status: 'in-progress',
      estimatedCompletion: '2026-12-31',
      performanceBondValue: 150000,
      paymentBondValue: 150000
    },
    {
      id: 'CONTRACT-002',
      name: 'Warehouse Renovation',
      contractValue: 1000000,
      costToDate: 850000,
      billedToDate: 850000,
      percentComplete: 85,
      status: 'in-progress',
      estimatedCompletion: '2026-08-31',
      performanceBondValue: 100000,
      paymentBondValue: 100000
    }
  ]
};

export function SuretyAnalysisPOC() {
  const [activeTab, setActiveTab] = useState('input');
  const [financialData, setFinancialData] = useState(DEFAULT_FINANCIAL_DATA);
  const [wipData, setWipData] = useState(DEFAULT_WIP_DATA);
  const [analysisType, setAnalysisType] = useState('full');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        financials: financialData,
        wipDetails: wipData,
        analysisType,
        spreadingOptions: { underwriter: 'System' }
      };

      const token = await getAuthToken();
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch('/api/v1/surety/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const result = await response.json();
      setAnalysis(result.data);
      setActiveTab('results');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' };
      case 'high':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' };
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' };
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const RiskIcon = ({ level }) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Surety Bond Analysis</h1>
          </div>
          <p className="text-slate-600">
            Contractor surety underwriting with as-allowed spreading and bond exposure analysis
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'input'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Financial Input
          </button>
          {analysis && (
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Analysis Results
            </button>
          )}
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && <FinancialInput
          financialData={financialData}
          setFinancialData={setFinancialData}
          wipData={wipData}
          setWipData={setWipData}
          analysisType={analysisType}
          setAnalysisType={setAnalysisType}
          onAnalyze={handleAnalyze}
          loading={loading}
          error={error}
        />}

        {/* Results Tab */}
        {activeTab === 'results' && analysis && <AnalysisResults
          analysis={analysis}
          getRiskColor={getRiskColor}
          getRiskBadge={getRiskBadge}
          RiskIcon={RiskIcon}
          formatCurrency={formatCurrency}
        />}
      </div>
    </div>
  );
}

/**
 * Financial Input Form Component
 */
function FinancialInput({
  financialData,
  setFinancialData,
  wipData,
  setWipData,
  analysisType,
  setAnalysisType,
  onAnalyze,
  loading,
  error
}) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Analysis Failed</h3>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Type Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Analysis Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'spreading', label: 'As-Allowed Spreading', desc: 'Financial adjustments only' },
            { value: 'wip', label: 'WIP Analysis', desc: 'Construction schedule & bonds' },
            { value: 'full', label: 'Full Analysis', desc: 'Both analyses combined' }
          ].map(option => (
            <label key={option.value} className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              analysisType === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input
                type="radio"
                name="analysisType"
                value={option.value}
                checked={analysisType === option.value}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-slate-900">{option.label}</div>
                <div className="text-sm text-slate-600">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Financial Data Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Financial Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Annual Revenue</label>
            <input
              type="number"
              value={financialData.revenue}
              onChange={(e) => setFinancialData({ ...financialData, revenue: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gross Profit</label>
            <input
              type="number"
              value={financialData.grossProfit}
              onChange={(e) => setFinancialData({ ...financialData, grossProfit: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Operating Expenses</label>
            <input
              type="number"
              value={financialData.expenses}
              onChange={(e) => setFinancialData({ ...financialData, expenses: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Net Income</label>
            <input
              type="number"
              value={financialData.netIncome}
              onChange={(e) => setFinancialData({ ...financialData, netIncome: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Total Assets</label>
            <input
              type="number"
              value={financialData.assets}
              onChange={(e) => setFinancialData({ ...financialData, assets: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Total Liabilities</label>
            <input
              type="number"
              value={financialData.liabilities.total}
              onChange={(e) => setFinancialData({
                ...financialData,
                liabilities: { ...financialData.liabilities, total: parseFloat(e.target.value) || 0 }
              })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Total Equity</label>
            <input
              type="number"
              value={financialData.equity}
              onChange={(e) => setFinancialData({ ...financialData, equity: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Business Age (years)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={financialData.businessAge}
              onChange={(e) => setFinancialData({ ...financialData, businessAge: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Industry Type</label>
            <select
              value={financialData.industryType}
              onChange={(e) => setFinancialData({ ...financialData, industryType: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="General Contracting">General Contracting</option>
              <option value="Heavy Civil">Heavy Civil Construction</option>
              <option value="Specialty Contracting">Specialty Contracting</option>
              <option value="Mechanical">Mechanical/HVAC</option>
              <option value="Electrical">Electrical Contracting</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-600">
          <p>Equity calculated: ${financialData.assets - financialData.liabilities.total >= 0 ? (financialData.assets - financialData.liabilities.total).toLocaleString() : 'Negative'}</p>
        </div>
      </div>

      {/* WIP Data Form (shown only for WIP or Full analysis) */}
      {(analysisType === 'wip' || analysisType === 'full') && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Work-in-Progress Schedule</h2>
          </div>

          <div className="space-y-4">
            {wipData.contracts.map((contract, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contract ID</label>
                    <input
                      type="text"
                      value={contract.id}
                      onChange={(e) => {
                        const newContracts = [...wipData.contracts];
                        newContracts[idx].id = e.target.value;
                        setWipData({ contracts: newContracts });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contract Name</label>
                    <input
                      type="text"
                      value={contract.name}
                      onChange={(e) => {
                        const newContracts = [...wipData.contracts];
                        newContracts[idx].name = e.target.value;
                        setWipData({ contracts: newContracts });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contract Value</label>
                    <input
                      type="number"
                      value={contract.contractValue}
                      onChange={(e) => {
                        const newContracts = [...wipData.contracts];
                        newContracts[idx].contractValue = parseFloat(e.target.value) || 0;
                        setWipData({ contracts: newContracts });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost to Date</label>
                    <input
                      type="number"
                      value={contract.costToDate}
                      onChange={(e) => {
                        const newContracts = [...wipData.contracts];
                        newContracts[idx].costToDate = parseFloat(e.target.value) || 0;
                        setWipData({ contracts: newContracts });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Billed to Date</label>
                    <input
                      type="number"
                      value={contract.billedToDate}
                      onChange={(e) => {
                        const newContracts = [...wipData.contracts];
                        newContracts[idx].billedToDate = parseFloat(e.target.value) || 0;
                        setWipData({ contracts: newContracts });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">% Complete</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={contract.percentComplete}
                      onChange={(e) => {
                        const newContracts = [...wipData.contracts];
                        newContracts[idx].percentComplete = parseFloat(e.target.value) || 0;
                        setWipData({ contracts: newContracts });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 mt-4">
            Total WIP: {wipData.contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0).toLocaleString()} | Contracts: {wipData.contracts.length}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={onAnalyze}
          disabled={loading}
          className={`px-8 py-4 rounded-lg font-semibold text-white text-lg transition-all ${
            loading
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            '🔍 Run Comprehensive Analysis'
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Analysis Results Display Component
 */
function AnalysisResults({
  analysis,
  getRiskColor,
  getRiskBadge,
  RiskIcon,
  formatCurrency
}) {
  const colors = getRiskColor(analysis.combinedRiskAssessment.overallRiskLevel);

  return (
    <div className="space-y-6">
      {/* Overall Risk Assessment */}
      <div className={`rounded-lg border-2 p-8 ${colors.bg} ${colors.border}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <RiskIcon level={analysis.combinedRiskAssessment.overallRiskLevel} />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Overall Risk Assessment</h2>
              <p className={`text-sm ${colors.text}`}>
                Comprehensive surety underwriting analysis
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full font-semibold ${getRiskBadge(analysis.combinedRiskAssessment.overallRiskLevel)}`}>
            {analysis.combinedRiskAssessment.overallRiskLevel.toUpperCase()}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 mb-2">Underwriting Narrative</h3>
          <p className="text-slate-700 leading-relaxed">
            {analysis.combinedRiskAssessment.underwritingNarrative}
          </p>
        </div>

        <div className="bg-white/60 rounded p-4">
          <h3 className="font-semibold text-slate-900 mb-2">Recommended Action</h3>
          <p className="text-slate-700 font-medium">
            {analysis.combinedRiskAssessment.recommendedAction}
          </p>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'As-Allowed Net Income',
            value: analysis.spreadingAnalysis?.asAllowed?.asAllowedNetIncome || 0,
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            label: 'Net Margin',
            value: `${(analysis.spreadingAnalysis?.asAllowed?.asAllowedNetIncomePercentage || 0).toFixed(1)}%`,
            icon: BarChart3,
            color: 'text-blue-600'
          },
          {
            label: 'Total WIP',
            value: analysis.wipAnalysis?.wipSummary?.totalWIP || 0,
            icon: Building2,
            color: 'text-purple-600'
          },
          {
            label: 'Bond Exposure',
            value: analysis.wipAnalysis?.bondExposure?.totalBondValue || 0,
            icon: AlertCircle,
            color: 'text-orange-600'
          }
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="bg-white rounded-lg border border-slate-200 p-6">
              <Icon className={`w-6 h-6 ${metric.color} mb-2`} />
              <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-slate-900">
                {typeof metric.value === 'string' ? metric.value : formatCurrency(metric.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Key Findings */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Findings & Risk Factors</h2>
        {analysis.combinedRiskAssessment.keyFindings.length > 0 ? (
          <div className="space-y-3">
            {analysis.combinedRiskAssessment.keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className={`flex gap-3 p-4 rounded-lg ${
                  finding.severity === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : finding.severity === 'high'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                {finding.severity === 'critical' ? (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : finding.severity === 'high' ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    [{finding.category}] {finding.code}
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{finding.message}</p>
                  <span className={`inline-block text-xs font-medium px-2 py-1 rounded mt-2 ${
                    finding.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : finding.severity === 'high'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {finding.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-900 font-semibold">No critical findings detected</p>
            <p className="text-green-700 text-sm">Application appears favorable for underwriting</p>
          </div>
        )}
      </div>

      {/* Spreading Engine Details */}
      {analysis.spreadingAnalysis && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">As-Allowed Spreading Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Original Figures</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Revenue</span>
                  <span className="text-slate-900 font-medium">
                    {formatCurrency(analysis.spreadingAnalysis.original?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Net Income</span>
                  <span className="text-slate-900 font-medium">
                    {formatCurrency(analysis.spreadingAnalysis.original?.netIncome || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">As-Allowed Adjustments</h3>
              <div className="space-y-2 text-sm">
                {analysis.spreadingAnalysis.adjustments && Object.entries(analysis.spreadingAnalysis.adjustments).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-slate-900 font-medium">
                      {typeof value === 'object' && value.amount ? formatCurrency(value.amount) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WIP Analysis Details */}
      {analysis.wipAnalysis?.wipSummary && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Work-in-Progress Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total WIP Value</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(analysis.wipAnalysis.wipSummary.totalWIP)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Active Contracts</p>
              <p className="text-2xl font-bold text-slate-900">
                {analysis.wipAnalysis.wipSummary.activeContracts}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Average Margin</p>
              <p className="text-2xl font-bold text-slate-900">
                {(analysis.wipAnalysis.wipSummary.averageGrossMargin || 0).toFixed(1)}%
              </p>
            </div>
          </div>
          {analysis.wipAnalysis.contractAnalysis && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Contract Details</h3>
              <div className="space-y-3">
                {analysis.wipAnalysis.contractAnalysis.map((contract, idx) => (
                  <div key={idx} className="border border-slate-200 rounded p-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-slate-900">{contract.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contract.grossMarginToDated < 5 ? 'bg-red-100 text-red-800' :
                        contract.grossMarginToDated < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {contract.grossMarginToDated.toFixed(1)}% margin
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>Value: {formatCurrency(contract.contractValue)}</div>
                      <div>Cost: {formatCurrency(contract.costToDate)}</div>
                      <div>{contract.percentComplete}% Complete</div>
                      <div>Status: {contract.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Analysis ID: {analysis.analysisId}</span>
          <span>Completed: {new Date(analysis.timestamp).toLocaleString()}</span>
        </div>
        <div className="mt-2">
          Analyst: {analysis.metadata?.underwriter} | Business Age: {analysis.metadata?.businessAge} years | Industry: {analysis.metadata?.industryType}
        </div>
      </div>
    </div>
  );
}
