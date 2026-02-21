"use client";

import { useEffect, useState } from "react";

/**
 * Animated interactive demo that mirrors the Quick Scan flow:
 *   1. Upload resume (single step — no JD needed)
 *   2. Scanning against market roles (stage checklist + progress)
 *   3. Quick Scan results (ranked role list with scores)
 *   4. Pro upgrade (tailored CV preview + before/after)
 * Auto-advances every 5 seconds. Clickable step dots.
 */
export default function AnimatedDemo() {
  const [step, setStep] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [rolesRevealed, setRolesRevealed] = useState(0);

  const TOTAL_STEPS = 4;

  // Auto-advance steps
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % TOTAL_STEPS);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Animate scanning stage checklist when step 1 is active
  useEffect(() => {
    if (step === 1) {
      setStageIdx(0);
      setProgressPct(5);
      const stages = [
        { delay: 400, pct: 20 },
        { delay: 1000, pct: 40 },
        { delay: 1800, pct: 60 },
        { delay: 2600, pct: 80 },
        { delay: 3400, pct: 95 },
      ];
      const timers = stages.map((s, i) =>
        setTimeout(() => { setStageIdx(i + 1); setProgressPct(s.pct); }, s.delay)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  // Animate role rows appearing one by one when step 2 is active
  useEffect(() => {
    if (step === 2) {
      setRolesRevealed(0);
      const timers = ROLE_RESULTS.map((_, i) =>
        setTimeout(() => setRolesRevealed(i + 1), 300 + i * 250)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  const urls = [
    "resumemate.ai/analyze",
    "resumemate.ai/analyze",
    "resumemate.ai/results/quick",
    "resumemate.ai/results/quick",
  ];

  const stepLabels = [
    { label: "Upload", color: "bg-blue-500" },
    { label: "Scan", color: "bg-indigo-500" },
    { label: "Results", color: "bg-blue-500" },
    { label: "Upgrade", color: "bg-green-500" },
  ];

  const scanStages = ["Parse resume", "Extract skills", "Match against 45+ roles", "Score profiles", "Rank results"];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Browser mockup frame */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1.5 text-xs text-gray-400 border border-gray-200 transition-all duration-500">
            {urls[step]}
          </div>
        </div>

        {/* Screen content */}
        <div className="relative min-h-[340px] sm:min-h-[380px] overflow-hidden bg-gray-50/30">

          {/* ══════ Step 0: Upload Resume ══════ */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-700 ${step === 0 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"}`}>
            <div className="mx-auto max-w-md">
              {/* Quick Scan badge */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-semibold text-blue-700">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Scan — No job description needed
                </span>
              </div>

              {/* Upload area */}
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 px-4 py-6 sm:py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  <span className="text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-[10px] sm:text-xs text-gray-400">PDF, DOCX, or TXT — up to 10 MB</p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {["PDF", "DOCX", "TXT"].map((fmt) => (
                    <span key={fmt} className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-gray-500">.{fmt.toLowerCase()}</span>
                  ))}
                </div>
              </div>

              {/* Animated file upload success */}
              <div className="mt-3 animate-bounce-slow">
                <div className="flex items-center gap-2 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">Sarah_Chen_Resume.pdf</p>
                    <p className="text-[10px] text-gray-500">4,832 characters extracted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════ Step 1: Scanning Against Roles ══════ */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-700 ${step === 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
            <div className="w-full max-w-sm text-center">
              {/* Spinner */}
              <svg className="mx-auto h-7 w-7 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-gray-700">Scanning against market roles...</p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>0:08 elapsed</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Stage checklist */}
              <div className="mt-4 text-left space-y-1">
                {scanStages.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {i < stageIdx ? (
                      <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i === stageIdx ? (
                      <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300" />
                    )}
                    <span className={i < stageIdx ? "text-gray-500" : i === stageIdx ? "font-medium text-gray-800" : "text-gray-400"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════ Step 2: Quick Scan Results — Ranked Role List ══════ */}
          <div className={`absolute inset-0 p-3 sm:p-4 transition-all duration-700 ${step === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
            <div className="mx-auto max-w-lg">
              {/* Dark hero card with best score */}
              <div className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-3 text-white mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide">Best Match</p>
                    <p className="text-sm font-bold mt-0.5">Sr. Software Engineer</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Matched against 8 roles</p>
                  </div>
                  {/* Circular score gauge */}
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${Math.PI * 48}`}
                        strokeDashoffset={`${Math.PI * 48 * (1 - 0.58)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-yellow-400">58</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role list */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide px-1">Role Matches</p>
                {ROLE_RESULTS.map((role, i) => (
                  <div
                    key={role.title}
                    className={`flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 transition-all duration-500 ${
                      i < rolesRevealed
                        ? "opacity-100 translate-y-0 border-gray-200"
                        : "opacity-0 translate-y-2 border-transparent"
                    } ${i === 0 ? "ring-1 ring-primary/20 border-primary/30" : ""}`}
                  >
                    {/* Rank */}
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                      i === 0 ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                    }`}>{i + 1}</span>

                    {/* Title + category */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-900 truncate">{role.title}</p>
                      <p className="text-[8px] text-gray-400">{role.category}</p>
                    </div>

                    {/* Score bar + number */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-12 sm:w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${role.color}`}
                          style={{ width: i < rolesRevealed ? `${role.score}%` : "0%" }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold w-6 text-right ${role.textColor}`}>{i < rolesRevealed ? role.score : 0}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline CTA */}
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-[9px] text-blue-700 font-medium">14 missing keywords found</p>
                <span className="rounded-md bg-primary px-2.5 py-1 text-[9px] font-bold text-white">Fix My Resume — $5</span>
              </div>
            </div>
          </div>

          {/* ══════ Step 3: Pro Upgrade — Before/After ══════ */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-700 ${step === 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
            <div className="mx-auto max-w-lg">
              {/* Pro badge */}
              <div className="mb-1">
                <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-semibold text-white">Pro</span>
              </div>
              <p className="mb-3 text-sm font-bold text-gray-900">Your Tailored Resume is Ready</p>

              {/* Before/After score banner */}
              <div className="mb-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-gray-600">Before: <span className="font-bold text-gray-900">58</span></div>
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-[10px]">
                    New Score: <span className="text-xl font-bold text-green-700">89</span>
                    <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">+31</span>
                  </div>
                  <span className="ml-auto text-[9px] font-semibold text-green-700">Strong Match</span>
                </div>
              </div>

              {/* What's included */}
              <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
                <p className="mb-2 text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Your Tailor Pack Includes</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Keywords Added", value: "14", icon: "+" },
                    { label: "Bullets Rewritten", value: "8", icon: "~" },
                    { label: "Cover Letter", value: "1", icon: ">" },
                    { label: "Score Boost", value: "+31", icon: "^" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.value}</p>
                        <p className="text-[8px] text-gray-500">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bullet rewrite preview */}
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="mb-2 text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Bullet Rewrite Preview</p>
                <div className="space-y-2">
                  <div className="rounded-lg bg-red-50 px-2.5 py-1.5">
                    <p className="text-[8px] font-semibold text-red-400 uppercase">Before</p>
                    <p className="text-[9px] sm:text-[10px] text-red-700 leading-tight">Worked on the backend migration project</p>
                  </div>
                  <div className="rounded-lg bg-green-50 px-2.5 py-1.5">
                    <p className="text-[8px] font-semibold text-green-400 uppercase">After</p>
                    <p className="text-[9px] sm:text-[10px] text-green-700 leading-tight">Led migration of monolith to microservices architecture, reducing deploy time by 73% and improving uptime to 99.9%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky download bar */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">Score: 89 <span className="text-green-600">(+31)</span></span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded border border-gray-300 px-2 py-1 text-[8px] font-medium text-gray-600">Copy All</span>
                  <span className="rounded-l bg-primary px-2.5 py-1 text-[8px] font-semibold text-white">Download</span>
                  <span className="rounded-r border-l border-blue-500 bg-primary px-1 py-1 text-[8px] text-white">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2.5">
          {stepLabels.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1 rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium transition-all duration-300 ${
                step === i
                  ? `${s.color} text-white shadow-sm`
                  : i < step
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}
            >
              {i < step && (
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {step === i && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Demo data ── */

const ROLE_RESULTS = [
  { title: "Sr. Software Engineer", category: "Engineering", score: 58, color: "bg-yellow-400", textColor: "text-yellow-600" },
  { title: "Full-Stack Developer", category: "Engineering", score: 54, color: "bg-yellow-400", textColor: "text-yellow-600" },
  { title: "Frontend Developer", category: "Engineering", score: 52, color: "bg-yellow-400", textColor: "text-yellow-600" },
  { title: "Engineering Manager", category: "Career Growth", score: 41, color: "bg-orange-400", textColor: "text-orange-600" },
  { title: "DevOps Engineer", category: "Engineering", score: 38, color: "bg-orange-400", textColor: "text-orange-600" },
  { title: "Tech Lead", category: "Career Growth", score: 35, color: "bg-red-400", textColor: "text-red-500" },
];
