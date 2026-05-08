// ── Surety Bond Underwriting Dashboard ──
// Commercial surety bond risk analysis and document processing
// Part of the modular monolith: shared document parser with SBA domain

import { Upload, FileText, TrendingUp, AlertCircle, CheckCircle, Zap, Loader2, Check } from 'lucide-react';
import { useState } from 'react';

export function SuretyDashboard({ onUploadDocument, onNavigate }) {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('ready');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus('uploading');
    try {
      // This would call the shared document parser
      await onUploadDocument(selectedFile);
      setUploadStatus('success');
      setSelectedFile(null);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-300 pb-4">
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Surety Bond Underwriting
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Commercial surety risk analysis, financial spreading, and contractor WIP monitoring
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Bonds', value: '—', hint: 'Upload documents to analyze' },
          { label: 'Portfolio Risk', value: '—', hint: 'AI-assessed bond risk profile' },
          { label: 'Documents', value: '0', hint: 'Financial statements & returns' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white border border-slate-300 rounded-sm p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</p>
            <p className="text-xs text-slate-500">{metric.hint}</p>
          </div>
        ))}
      </div>

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
              Submit financial documents for AI-powered analysis
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
                {uploadStatus === 'success' && 'Document received and queued for analysis'}
                {uploadStatus === 'error' && 'Upload failed. Please try again.'}
                {uploadStatus === 'uploading' && 'Uploading and parsing...'}
                {uploadStatus === 'ready' && `${selectedFile?.name} — ready to upload`}
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
                  <Upload className="w-4 h-4" /> Upload Document
                </>
              )}
            </button>

            {/* Supported Documents */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs space-y-1.5">
              <p className="font-semibold text-slate-700">Recommended Documents:</p>
              <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                <li>Federal Business Tax Returns (3 years)</li>
                <li>YTD Financial Statements & Balance Sheet</li>
                <li>Corporate Bank Statements (recent)</li>
                <li>Organizational Documents (Articles, Bylaws)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Analysis Tools Section */}
        <div className="space-y-4">
          {/* As-Allowed Spreading Engine */}
          <div className="bg-white border border-slate-300 overflow-hidden">
            <div className="bg-[#0A2540] px-4 py-3 flex items-center gap-3 border-b border-[#1B3A6B]">
              <TrendingUp className="w-4 h-4 text-blue-300 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">As-Allowed Spreading Engine</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">SBA-approved spreading methodologies</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> SBA 13(g)(2) spreading methodologies</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Industry-adjusted financial metrics</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Guarantor capacity analysis</li>
              </ul>
              <button
                onClick={() => onNavigate('spreading')}
                className="w-full bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-bold py-2.5 px-4 uppercase tracking-wide text-xs transition-colors duration-150"
              >
                Open Spreading Engine
              </button>
            </div>
          </div>

          {/* WIP Analyzer */}
          <div className="bg-white border border-slate-300 overflow-hidden">
            <div className="bg-[#0A2540] px-4 py-3 flex items-center gap-3 border-b border-[#1B3A6B]">
              <TrendingUp className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">WIP Analyzer</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Contractor work-in-progress monitoring</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Job-by-job WIP analysis</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Profitability trending</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Contingent liability assessment</li>
              </ul>
              <button
                onClick={() => onNavigate('wip')}
                className="w-full bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-bold py-2.5 px-4 uppercase tracking-wide text-xs transition-colors duration-150"
              >
                Open WIP Analyzer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex items-start gap-3">
        <Zap className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-slate-900 mb-1">Shared Document Parser</p>
          <p className="text-slate-700">
            Documents uploaded here use the same AI-powered OCR and tabular data extraction engine
            as the SBA 7(a) module. One submission, two analytical pathways.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuretyDashboard;
