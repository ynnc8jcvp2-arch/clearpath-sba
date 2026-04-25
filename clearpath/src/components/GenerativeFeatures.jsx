import { Zap, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function GenerativeFeatures({
  onExtract,
  onGenerate,
  extracting = false,
  generating = false,
  extractNotes = '',
  onNotesChange,
  extractStatus = null,
  generateStatus = null,
  canGenerate = false
}) {
  return (
    <div className="space-y-6 mb-8">
      {/* GENERATE LOAN PARAMETERS */}
      <div className="border border-slate-300 rounded-sm overflow-hidden bg-white hover:border-slate-400 transition-colors">
        {/* Header with accent bar */}
        <div className="flex gap-0">
          <div className="w-1 bg-[#1B3A6B]"></div>
          <div className="flex-1 p-5">
            {/* Title Section */}
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-[#1B3A6B]" />
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">GENERATE LOAN PARAMETERS</h3>
                <p className="text-xs text-slate-600 font-medium">AI-powered extraction from deal notes</p>
              </div>
            </div>

            {/* Textarea Input */}
            <textarea
              value={extractNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Paste unstructured client notes. The system will extract loan parameters..."
              className="w-full bg-slate-50 border border-slate-300 rounded-sm px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] focus:border-[#1B3A6B] transition-colors resize-none h-32 mb-4"
              disabled={extracting}
            />

            {/* Generate Button */}
            <button
              onClick={onExtract}
              disabled={!extractNotes.trim() || extracting}
              className="w-full bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-semibold text-sm px-6 py-3 rounded-none border border-[#0A2540] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Parameters...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  GENERATE PARAMETERS
                </>
              )}
            </button>

            {/* Status Indicators */}
            {extractStatus === 'success' && (
              <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Parameters extracted successfully
              </div>
            )}
            {extractStatus === 'error' && (
              <div className="mt-3 flex items-center gap-2 text-red-700 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Failed to extract parameters. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE TERM SHEET */}
      <div className={`border rounded-sm overflow-hidden bg-white transition-colors ${canGenerate ? 'border-slate-300 hover:border-slate-400' : 'border-slate-200 opacity-75'}`}>
        {/* Header with accent bar */}
        <div className="flex gap-0">
          <div className={`w-1 ${canGenerate ? 'bg-[#1B3A6B]' : 'bg-slate-300'}`}></div>
          <div className="flex-1 p-5">
            {/* Title Section */}
            <div className="flex items-center gap-3 mb-4">
              <FileText className={`w-5 h-5 ${canGenerate ? 'text-[#1B3A6B]' : 'text-slate-400'}`} />
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">CREATE TERM SHEET</h3>
                <p className="text-xs text-slate-600 font-medium">AI-generated institutional document</p>
              </div>
            </div>

            {/* Precondition Notice */}
            {!canGenerate && (
              <div className="bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 mb-4">
                <p className="text-sm text-slate-700 font-medium">
                  ℹ️ Complete loan parameters first by generating them above, or fill in all required fields in the loan parameters section.
                </p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={!canGenerate || generating}
              className="w-full bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-semibold text-sm px-6 py-3 rounded-none border border-[#0A2540] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Term Sheet...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  CREATE TERM SHEET
                </>
              )}
            </button>

            {/* Status Indicators */}
            {generateStatus === 'success' && (
              <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Term sheet generated successfully
              </div>
            )}
            {generateStatus === 'error' && (
              <div className="mt-3 flex items-center gap-2 text-red-700 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Failed to generate term sheet. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
