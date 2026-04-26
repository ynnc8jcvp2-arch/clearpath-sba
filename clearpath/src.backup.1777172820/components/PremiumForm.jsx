import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PremiumForm({
  title,
  subtitle,
  progress,
  children,
  onNext,
  onBack,
  nextDisabled,
  showBackButton = true,
  nextButtonText = 'Continue',
  backButtonText = 'Back'
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      {progress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div></div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {progress.current} of {progress.total}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-none h-1.5 overflow-hidden">
            <div
              className="bg-[#1B3A6B] h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Title Section */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900 mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-600 text-sm leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="bg-white border border-slate-300 rounded-sm p-6 mb-8">
        {children}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        {showBackButton ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm px-6 py-3 rounded-none border border-slate-400 transition-colors duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {backButtonText}
          </button>
        ) : (
          <div></div>
        )}

        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex items-center gap-2 bg-[#1B3A6B] hover:bg-[#0A2540] text-white font-semibold text-sm px-6 py-3 rounded-none border border-[#0A2540] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextButtonText}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
