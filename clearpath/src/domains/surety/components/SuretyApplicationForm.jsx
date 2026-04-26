import React, { useState } from 'react';
import { SuretyClient } from '../api/suretyClient';
import { AnalysisResults } from './AnalysisResults';

export function SuretyApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [document, setDocument] = useState(null);
  const [documentType, setDocumentType] = useState('balance-sheet');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null);

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocument({
        name: file.name,
        content: event.target.result,
        type: file.type,
      });
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!document) {
      setError('Please select a document');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await SuretyClient.processApplication(document, {
        documentType,
        analysisType: 'full',
      });

      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Surety Bond Underwriting
          </h1>
          <p className="text-slate-400 text-lg">
            AI-powered analysis for commercial surety bond applications
          </p>
        </div>

        {!analysis ? (
          // Upload Form
          <div className="space-y-6">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-xl p-8"
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-4">
                  Financial Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="balance-sheet">Balance Sheet</option>
                  <option value="income-statement">Income Statement</option>
                  <option value="tax-return">Tax Return</option>
                  <option value="cash-flow">Cash Flow Statement</option>
                  <option value="unknown">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-4">
                  Upload Document
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.txt,.csv,.docx"
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-slate-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-slate-900 font-medium">
                      {document ? document.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-slate-600 text-sm mt-1">
                      PDF, TXT, CSV, or DOCX (max 10MB)
                    </p>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !document}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Process Application'
                )}
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        ) : (
          // Results Display
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAnalysis(null);
                  setDocument(null);
                  setError(null);
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                ← Analyze Another Document
              </button>
            </div>

            <AnalysisResults analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}
