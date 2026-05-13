// ── Surety Bond Underwriting Dashboard ──
// Commercial surety bond risk analysis and document processing
// Part of the modular monolith: shared document parser with SBA domain

import { Clock3, Upload, TrendingUp, Zap, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SuretyClient } from '../api/suretyClient';
import ReadinessReport from './ReadinessReport';

export function SuretyDashboard({ onUploadDocument, onNavigate, user }) {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [savedPackets, setSavedPackets] = useState([]);
  const [loadingPackets, setLoadingPackets] = useState(false);

  const workflowStages = [
    {
      label: '1. Intake file',
      status: analysis ? 'complete' : selectedFile ? 'in-progress' : 'pending',
      detail: selectedFile ? 'File selected and ready to queue.' : analysis ? 'Structured intake completed.' : 'Collect current financials and support docs.',
    },
    {
      label: '2. Normalize financials',
      status: analysis?.spreadingAnalysis ? 'complete' : analysis ? 'ready' : 'pending',
      detail: analysis?.spreadingAnalysis ? 'Financial review observations captured in the readiness report.' : analysis ? 'Run spreading to pressure-test earnings support.' : 'Unlocks after the initial file is uploaded.',
    },
    {
      label: '3. Review WIP',
      status: analysis?.wipAnalysis ? 'complete' : analysis ? 'ready' : 'pending',
      detail: analysis?.wipAnalysis ? 'WIP concerns are packaged in the readiness report.' : analysis ? 'Check concentration, fade risk, and stressed jobs.' : 'Add the current WIP schedule to assess live work.',
    },
    {
      label: '4. Prep handoff',
      status: analysis?.readinessReport ? 'complete' : analysis ? 'ready' : 'pending',
      detail: analysis?.readinessReport ? 'Sharable output is ready for broker and underwriter handoff.' : analysis ? 'Package follow-up items before underwriter review.' : 'Summarize missing items and contractor questions.',
    },
  ];

  const stageStyles = {
    complete: 'border-green-200 bg-green-50 text-green-900',
    'in-progress': 'border-blue-200 bg-blue-50 text-blue-900',
    ready: 'border-amber-200 bg-amber-50 text-amber-900',
    pending: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  const handoffChecklist = [
    'Current fiscal-year financial statements',
    'Federal business tax returns with schedules',
    'Current WIP schedule or contract backlog support',
    'Requested bond details and underlying opportunity',
    'Organizational / indemnity support documents',
  ];

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadSavedPackets = async () => {
      setLoadingPackets(true);
      try {
        const records = await SuretyClient.listSavedApplications(6);
        if (!cancelled) {
          setSavedPackets(records);
        }
      } catch (error) {
        if (!cancelled) {
          setSavedPackets([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPackets(false);
        }
      }
    };

    loadSavedPackets();
    return () => {
      cancelled = true;
    };
  }, [user, analysis?.applicationId]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('ready');
      setUploadError('');
      setAnalysis(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus('uploading');
    setUploadError('');
    try {
      const nextAnalysis = await onUploadDocument(selectedFile);
      setAnalysis(nextAnalysis);
      setUploadStatus('success');
      setSelectedFile(null);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err.message || 'Upload failed. Please try again.');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const restoreSavedPacket = async (applicationId) => {
    setUploadError('');
    try {
      const saved = await SuretyClient.getSavedApplication(applicationId);
      setAnalysis({
        applicationId: saved.applicationId,
        ...(saved.analysis || {}),
      });
      setUploadStatus(null);
      setSelectedFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setUploadError(error.message || 'Failed to reopen saved packet.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-300 pb-4">
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Surety Submission Triage Workspace
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Turn contractor financials, WIP schedules, and support documents into a cleaner file for faster underwriter review.
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Submission Completeness',
            value: analysis?.readinessReport ? analysis.readinessReport.readinessStatus : selectedFile ? 'In Progress' : 'Waiting for file',
            hint: analysis?.readinessReport ? `${analysis.readinessReport.missingItems.length} item(s) still need attention before handoff` : selectedFile ? 'File selected and ready for structured intake' : 'Start with current financials, WIP, or support docs',
          },
          {
            label: 'Financial Review Readiness',
            value: analysis?.spreadingAnalysis ? 'Financial notes ready' : 'Pending analysis',
            hint: analysis?.spreadingAnalysis ? 'Margin support and leverage cues have been packaged' : 'Upload a file to queue financial review',
          },
          {
            label: 'WIP Review Status',
            value: analysis?.wipAnalysis ? 'WIP notes captured' : 'No WIP reviewed yet',
            hint: analysis?.wipAnalysis ? 'Use the analyzer to deepen stressed-job follow-up' : 'Add a WIP schedule to pressure-test open work',
          },
        ].map((metric) => (
          <div key={metric.label} className="bg-white border border-slate-300 rounded-sm p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              {metric.label}
            </p>
            <p className="text-lg font-bold text-slate-900 mb-1">{metric.value}</p>
            <p className="text-xs text-slate-500">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-blue-950">What this workspace does differently</p>
          <p className="text-blue-900">
            Instead of pushing raw contractor files straight into review, this workspace helps your team collect the right documents,
            normalize the numbers, and surface likely follow-up before the submission reaches an underwriter.
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] gap-4">
        <section className="bg-white border border-slate-300 rounded-sm p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Review Sequence</h2>
              <p className="text-xs text-slate-600 mt-1">Use the same path your surety team follows when deciding whether a file is ready for real underwriting time.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workflowStages.map((stage) => (
              <div key={stage.label} className={`border rounded-sm p-3 ${stageStyles[stage.status]}`}>
                <p className="text-xs font-bold uppercase tracking-wide">{stage.label}</p>
                <p className="mt-1 text-xs leading-relaxed">{stage.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-white border border-slate-300 rounded-sm p-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Underwriter Handoff Checklist</h2>
          <p className="text-xs text-slate-600 mt-1 mb-3">A clean surety file usually includes these items before deeper review begins.</p>
          <ul className="space-y-2 text-xs text-slate-700">
            {handoffChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-slate-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section className="border border-slate-300 bg-white p-4 rounded-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Recent Readiness Packets</h2>
            <p className="mt-1 text-xs text-slate-600">Reopen a saved contractor packet instead of regenerating the analysis from scratch.</p>
          </div>
          {loadingPackets && <span className="text-xs text-slate-500">Loading...</span>}
        </div>

        {savedPackets.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedPackets.map((packet) => (
              <button
                key={packet.applicationId}
                onClick={() => restoreSavedPacket(packet.applicationId)}
                className="border border-slate-300 rounded-sm bg-slate-50 p-4 text-left hover:border-slate-500 hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved Packet</p>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">{packet.applicantName || 'Contractor submission'}</h3>
                  </div>
                  <Clock3 className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {(packet.analysis?.readinessReport?.readinessStatus || packet.overallRiskLevel || 'saved').toString()}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Saved {new Date(packet.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-slate-300 rounded-sm px-4 py-5 text-xs text-slate-600">
            {loadingPackets ? 'Loading saved packets...' : 'No saved readiness packets yet. The next uploaded contractor file will be saved here automatically.'}
          </div>
        )}
      </section>

      {/* Two-Column Layout: Upload + Analysis Tools */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Document Upload Section */}
        <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-300 px-4 py-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Upload className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Document Upload
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Intake the current file so the team can triage completeness, normalize contractor financials, and prepare follow-up.
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-slate-300 rounded-sm p-6 text-center hover:border-slate-500 hover:bg-slate-50 transition-colors duration-150 cursor-pointer relative group">
              <input
                type="file"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.png"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">
                {selectedFile ? selectedFile.name : 'Drop file or click to upload'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                PDF, Excel, Word, or Image (Max 25MB)
              </p>
            </div>

            {/* Upload Status */}
            {uploadStatus && (
              <div
                className={`p-3 rounded-sm text-sm font-medium text-center border ${
                  uploadStatus === 'success'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : uploadStatus === 'error'
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {uploadStatus === 'success' && 'Document received. File is ready for triage and next-step review.'}
                {uploadStatus === 'error' && (uploadError || 'Upload failed. Please try again.')}
                {uploadStatus === 'uploading' && 'Uploading and preparing the file for structured review...'}
                {uploadStatus === 'ready' && `${selectedFile?.name} — ready to queue for triage`}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus === 'uploading'}
              className={`w-full py-3 px-4 rounded-sm font-bold uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                uploadStatus === 'uploading' || !selectedFile
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-[#1B3A6B] text-white hover:bg-[#0A2540]'
              }`}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Queue File for Triage
                </>
              )}
            </button>

            {/* Supported Documents */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs space-y-1.5">
              <p className="font-semibold text-slate-700">Recommended Documents:</p>
              <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                <li>Current business financial statements and balance sheet</li>
                <li>Federal business tax returns and supporting schedules</li>
                <li>Current WIP schedule or backlog support</li>
                <li>Organizational, indemnity, and ownership support documents</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Analysis Tools Section */}
        <div className="space-y-4">
          {/* As-Allowed Spreading Engine */}
          <div className="bg-gradient-to-br from-[#1B3A6B] to-[#0A2540] border border-[#1B3A6B] rounded-sm overflow-hidden shadow-sm">
            <div className="px-4 py-4 flex items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <TrendingUp className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  As-Allowed Spreading Engine
                </h3>
                <p className="text-xs text-slate-200 mt-1">
                  Normalize contractor financials before full review so weak margin support and earnings questions surface earlier.
                </p>
              </div>
            </div>
            <div className="px-4 py-4 bg-[#0A2540]/50 border-t border-[#1B3A6B] text-xs text-slate-100 space-y-2">
              <p>Structured as-allowed spreading inputs</p>
              <p>Faster view into earnings quality and margin support</p>
              <p>Cleaner follow-up list before underwriting time is spent</p>
              <button
                onClick={() => onNavigate('spreading')}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm uppercase tracking-wide text-xs transition-colors"
              >
                Run Financial Review
              </button>
            </div>
          </div>

          {/* WIP Analyzer */}
          <div className="bg-gradient-to-br from-[#0A2540] to-[#1B3A6B] border border-[#0A2540] rounded-sm overflow-hidden shadow-sm">
            <div className="px-4 py-4 flex items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <TrendingUp className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  WIP Analyzer
                </h3>
                <p className="text-xs text-slate-200 mt-1">
                  Pressure-test open jobs, backlog quality, and likely profit fade before the file moves deeper into review.
                </p>
              </div>
            </div>
            <div className="px-4 py-4 bg-[#1B3A6B]/50 border-t border-[#0A2540] text-xs text-slate-100 space-y-2">
              <p>Job-by-job WIP triage</p>
              <p>Early visibility into stress, concentration, and fade risk</p>
              <p>Sharper follow-up before underwriter handoff</p>
              <button
                onClick={() => onNavigate('wip')}
                className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-sm uppercase tracking-wide text-xs transition-colors"
              >
                Run WIP Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex items-start gap-3">
        <Zap className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-slate-900 mb-1">One Upload Path, Cleaner Review</p>
          <p className="text-slate-700">
            Documents uploaded here move through the same OCR and tabular extraction engine used elsewhere in BondSBA,
            which means less re-keying, faster structured intake, and a cleaner starting point for surety triage.
          </p>
        </div>
      </div>

      {analysis?.readinessReport && (
        <ReadinessReport report={analysis.readinessReport} analysis={analysis} />
      )}
    </div>
  );
}

export default SuretyDashboard;
