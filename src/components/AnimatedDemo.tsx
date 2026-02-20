"use client";

import { useEffect, useState } from "react";

/**
 * Animated interactive demo that cycles through the 3-step flow:
 *   1. Upload resume  →  2. See Match Score  →  3. Get tailored CV
 * Each "screen" is a stylized mockup of the real UI with smooth transitions.
 * Auto-advances every 4 seconds, or user can click the step dots.
 */
export default function AnimatedDemo() {
  const [step, setStep] = useState(0);
  const [scoreAnim, setScoreAnim] = useState(0);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Animate score count-up when step 1 is active
  useEffect(() => {
    if (step === 1) {
      setScoreAnim(0);
      const start = performance.now();
      let raf: number;
      function tick(now: number) {
        const progress = Math.min((now - start) / 1200, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setScoreAnim(Math.round(eased * 47));
        if (progress < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [step]);

  const steps = [
    { label: "Upload", color: "bg-blue-500" },
    { label: "Score", color: "bg-amber-500" },
    { label: "Download", color: "bg-green-500" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Browser mockup frame */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400 border border-gray-200">
            resumemate.ai/analyze
          </div>
        </div>

        {/* Screen content — fixed height with crossfade */}
        <div className="relative h-72 sm:h-80 overflow-hidden">
          {/* Step 1: Upload Resume */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
              step === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Drop your resume here</p>
            <p className="mt-1 text-xs text-gray-500">PDF, DOCX, or paste text</p>
            {/* Animated file dropping in */}
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 animate-bounce-slow">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-blue-700">Resume_2024.pdf</span>
              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Step 2: Match Score */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
              step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            {/* Mini score gauge */}
            <div className="relative mb-3">
              <svg className="h-24 w-36" viewBox="0 0 120 70">
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 50}`}
                  strokeDashoffset={`${Math.PI * 50 - (scoreAnim / 100) * Math.PI * 50}`}
                  style={{ transition: "stroke-dashoffset 0.1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pt-3">
                <span className="text-3xl font-bold text-yellow-600">{scoreAnim}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900">Match Score</p>
            <p className="mt-1 text-xs text-amber-600 font-medium">Needs Sharpening</p>
            {/* Mini breakdown bars */}
            <div className="mt-4 w-full max-w-xs space-y-1.5">
              {[
                { label: "Hard Skills", pct: 45, color: "bg-yellow-400" },
                { label: "Keywords", pct: 52, color: "bg-yellow-400" },
                { label: "Impact", pct: 38, color: "bg-red-400" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="w-20 text-[10px] text-gray-500 text-right">{bar.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-1000 ease-out`}
                      style={{ width: step === 1 ? `${bar.pct}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-[10px] font-medium text-gray-600">{step === 1 ? bar.pct : 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Tailored CV */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
              step === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">47 → 84</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">Your tailored CV is ready</p>
            <p className="mt-1 text-xs text-gray-500">+37 point improvement</p>
            {/* Mini document preview */}
            <div className="mt-4 w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-20 rounded bg-gray-800" />
                <div className="h-1.5 w-12 rounded bg-gray-300" />
              </div>
              <div className="space-y-1.5">
                <div className="h-1 w-full rounded bg-gray-200" />
                <div className="h-1 w-11/12 rounded bg-gray-200" />
                <div className="h-1 w-10/12 rounded bg-green-200" />
                <div className="h-1 w-full rounded bg-gray-200" />
                <div className="h-1 w-9/12 rounded bg-green-200" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-md bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white">Download PDF</span>
              <span className="rounded-md border border-gray-300 px-3 py-1 text-[10px] font-medium text-gray-600">DOCX</span>
            </div>
          </div>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          {steps.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                step === i
                  ? `${s.color} text-white`
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}
            >
              {step === i && (
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
