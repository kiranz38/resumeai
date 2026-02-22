"use client";

const STEPS = [
  { label: "Template", short: "1" },
  { label: "Contact", short: "2" },
  { label: "Experience", short: "3" },
  { label: "Education", short: "4" },
  { label: "Skills", short: "5" },
  { label: "Preview", short: "6" },
];

interface BuilderNavProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  onBack: () => void;
  onNext: () => void;
  canGoNext?: boolean;
}

export default function BuilderNav({
  currentStep,
  onStepClick,
  onBack,
  onNext,
  canGoNext = true,
}: BuilderNavProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.label}
            onClick={() => onStepClick(i)}
            className={`flex items-center gap-1 rounded-full px-2 py-1 sm:px-3 text-xs font-medium transition-colors ${
              i === currentStep
                ? "bg-blue-100 text-blue-700"
                : i < currentStep
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold sm:h-5 sm:w-5">
              {i < currentStep ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.short
              )}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Back / Next buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isFirst}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isFirst
              ? "cursor-not-allowed text-gray-300"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {!isLast && (
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors ${
              canGoNext
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-blue-300"
            }`}
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
