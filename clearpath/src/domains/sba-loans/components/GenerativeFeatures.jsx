// ── Generative Features Panel ──
// Prominent feature cards for AI-powered parameter extraction and term sheet generation
// Elevates the Extract Parameters and Compile Term Sheet functionality with clear status indicators

import { Zap, FileText, Loader2 } from 'lucide-react';

export function GenerativeFeatures({
  onExtractParameters,
  onCompileTermSheet,
  extractLoading = false,
  compileLoading = false,
  extractStatus = null,
  compileStatus = null,
  dealNotes = '',
  onDealNotesChange,
  loanComplete = false,
  extractComplete = false,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* ── Feature 1: Extract Parameters ── */}
      <div className="bg-white border border-slate-300 overflow-hidden">
        <div className="bg-[#0A2540] px-5 py-3 flex items-center gap-3 border-b border-[#1B3A6B]">
          <Zap className="w-4 h-4 text-yellow-300 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              Generate Loan Parameters
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              AI extraction from deal notes
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Deal Notes &amp; Context
            </label>
            <textarea
              value={dealNotes}
              onChange={(e) => onDealNotesChange(e.target.value)}
              disabled={extractLoading}
              placeholder="Paste client notes, business summary, or deal structure details..."
              className="w-full h-20 px-3 py-2 border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B] disabled:opacity-50 resize-none"
            />
          </div>

          <button
            onClick={onExtractParameters}
            disabled={extractLoading || !dealNotes.trim()}
            className={`w-full py-2.5 px-4 font-bold uppercase tracking-wide transition-colors duration-150 flex items-center justify-center gap-2 text-sm ${
              extractLoading || !dealNotes.trim()
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#0A2540]'
            }`}
          >
            {extractLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Parameters...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Parameters
              </>
            )}
          </button>

          {/* Status Indicator */}
          {extractStatus && (
            <div className={`px-3 py-2 text-xs font-medium border ${
              extractStatus === 'success' ? 'bg-green-50 text-green-800 border-green-300'
              : extractStatus === 'error' ? 'bg-red-50 text-red-800 border-red-300'
              : 'bg-blue-50 text-blue-800 border-blue-300'
            }`}>
              {extractStatus === 'success' && '✓ Parameters extracted and populated'}
              {extractStatus === 'error' && '✗ Extraction failed — try again'}
              {extractStatus === 'loading' && 'Extracting…'}
            </div>
          )}
        </div>
      </div>

      {/* ── Feature 2: Compile Term Sheet ── */}
      <div className="bg-white border border-slate-300 overflow-hidden">
        <div className="bg-[#0A2540] px-5 py-3 flex items-center gap-3 border-b border-[#1B3A6B]">
          <FileText className="w-4 h-4 text-blue-300 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              Create Term Sheet
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              AI-generated institutional document
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-slate-50 border border-slate-200 p-3">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-2">Prerequisites</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${loanComplete ? 'bg-green-600' : 'bg-slate-400'}`} />
                <span className={loanComplete ? 'text-green-700 font-medium' : 'text-slate-600'}>
                  Loan parameters {loanComplete ? '— complete' : '— pending'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${extractComplete ? 'bg-green-600' : 'bg-slate-400'}`} />
                <span className={extractComplete ? 'text-green-700 font-medium' : 'text-slate-600'}>
                  AI extraction {extractComplete ? '— complete' : '— optional'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onCompileTermSheet}
            disabled={compileLoading || !loanComplete}
            className={`w-full py-2.5 px-4 font-bold uppercase tracking-wide transition-colors duration-150 flex items-center justify-center gap-2 text-sm ${
              compileLoading || !loanComplete
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-[#0A2540] text-white hover:bg-[#1B3A6B]'
            }`}
          >
            {compileLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
            ) : (
              <><FileText className="w-4 h-4" />Create Term Sheet</>
            )}
          </button>

          {compileStatus && (
            <div className={`px-3 py-2 text-xs font-medium border ${
              compileStatus === 'success' ? 'bg-green-50 text-green-800 border-green-300'
              : compileStatus === 'error' ? 'bg-red-50 text-red-800 border-red-300'
              : 'bg-blue-50 text-blue-800 border-blue-300'
            }`}>
              {compileStatus === 'success' && '✓ Term sheet generated — modal open'}
              {compileStatus === 'error' && '✗ Generation failed — try again'}
              {compileStatus === 'loading' && 'Generating…'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerativeFeatures;
