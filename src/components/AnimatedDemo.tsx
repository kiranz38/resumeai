"use client";

import { useEffect, useState } from "react";

/**
 * Animated interactive demo that mirrors the real site UI across 4 steps:
 *   1. Upload resume (actual ResumeUploader look)
 *   2. Analyzing progress (stage checklist + progress bar)
 *   3. Results page (ScoreCard gauge + breakdown bars + keywords + blocker)
 *   4. Tailored CV (before/after score + resume preview + download bar)
 * Auto-advances every 5 seconds. Clickable step dots.
 */
export default function AnimatedDemo() {
  const [step, setStep] = useState(0);
  const [scoreAnim, setScoreAnim] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  const TOTAL_STEPS = 4;

  // Auto-advance steps
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % TOTAL_STEPS);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Animate score count-up when step 2 is active
  useEffect(() => {
    if (step === 2) {
      setScoreAnim(0);
      const start = performance.now();
      let raf: number;
      function tick(now: number) {
        const progress = Math.min((now - start) / 1400, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setScoreAnim(Math.round(eased * 47));
        if (progress < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [step]);

  // Animate analyzing stage checklist when step 1 is active
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

  const urls = [
    "resumemate.ai/analyze",
    "resumemate.ai/analyze",
    "resumemate.ai/results",
    "resumemate.ai/results/pro",
  ];

  const stepLabels = [
    { label: "Upload", color: "bg-blue-500" },
    { label: "Analyze", color: "bg-indigo-500" },
    { label: "Score", color: "bg-blue-500" },
    { label: "Tailored CV", color: "bg-green-500" },
  ];

  const analyzeStages = ["Parse resume", "Extract skills", "Match requirements", "Keyword check", "Compute score"];
  const circumference = Math.PI * 50;

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
              {/* Step dots (mirrors real analyze page) */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                  <span className="flex h-3 w-3 items-center justify-center text-[8px]">1</span> Resume
                </span>
                <div className="h-px w-4 bg-gray-200" />
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-400">
                  <span className="flex h-3 w-3 items-center justify-center text-[8px]">2</span> Job Description
                </span>
              </div>

              {/* Upload area (mirrors ResumeUploader) */}
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 px-4 py-6 sm:py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  <span className="text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-[10px] sm:text-xs text-gray-400">PDF, DOCX, or TXT — up to 10 MB</p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {["PDF", "DOCX", "TXT"].map((fmt) => (
                    <span key={fmt} className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-gray-500">.{fmt.toLowerCase()}</span>
                  ))}
                </div>
              </div>

              {/* Animated file upload success (appears after delay) */}
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

          {/* ══════ Step 1: Analyzing ══════ */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-700 ${step === 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
            <div className="w-full max-w-sm text-center">
              {/* Spinner */}
              <svg className="mx-auto h-7 w-7 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-gray-700">Computing your Match Score...</p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>0:12 elapsed</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Stage checklist (mirrors real loading) */}
              <div className="mt-4 text-left space-y-1">
                {analyzeStages.map((label, i) => (
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

          {/* ══════ Step 2: Results Page ══════ */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-700 ${step === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
            <div className="mx-auto max-w-lg">
              <p className="mb-3 text-sm font-bold text-gray-900">Your Resume Match</p>
              <p className="mb-3 text-[10px] text-gray-500">Analysis for Senior Full-Stack Engineer at CloudScale Inc.</p>

              {/* Score + Breakdown side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* ScoreCard primary gauge */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                  <div className="relative mx-auto h-16 w-24 sm:h-20 sm:w-28">
                    <svg className="h-full w-full" viewBox="0 0 120 70">
                      <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" />
                      <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#eab308" strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={`${circumference - (scoreAnim / 100) * circumference}`}
                        style={{ transition: "stroke-dashoffset 0.1s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                      <span className="text-xl sm:text-2xl font-bold text-yellow-600">{scoreAnim}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-blue-600">Needs Sharpening</p>
                  <p className="text-[9px] text-gray-400">Match Score</p>
                </div>

                {/* Breakdown bars */}
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="mb-2 text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Match Breakdown</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Hard Skills", pct: 45, color: "bg-yellow-400" },
                      { label: "Soft Skills", pct: 62, color: "bg-blue-400" },
                      { label: "Results", pct: 38, color: "bg-yellow-400" },
                      { label: "Keywords", pct: 52, color: "bg-yellow-400" },
                      { label: "Formatting", pct: 70, color: "bg-blue-400" },
                    ].map((bar) => (
                      <div key={bar.label} className="flex items-center gap-1.5">
                        <span className="w-16 text-[8px] sm:text-[9px] text-gray-500 text-right truncate">{bar.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${bar.color} transition-all duration-1000 ease-out`}
                            style={{ width: step === 2 ? `${bar.pct}%` : "0%" }} />
                        </div>
                        <span className="w-4 text-[8px] font-medium text-gray-600 text-right">{step === 2 ? bar.pct : 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Missing keywords */}
              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                <p className="mb-2 text-[9px] font-semibold text-gray-700">Missing Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {["Python", "Go", "Kubernetes", "CI/CD", "Terraform", "GraphQL"].map((kw) => (
                    <span key={kw} className="rounded-full bg-red-50 px-2 py-0.5 text-[8px] sm:text-[9px] font-medium text-red-700 ring-1 ring-red-200">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Blocker cards preview */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {/* Visible blocker */}
                <div className="rounded-lg border border-gray-200 bg-white p-2">
                  <div className="mb-1 flex items-center gap-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[7px] font-bold text-blue-700">1</span>
                    <span className="text-[8px] font-semibold text-gray-900 truncate">No metrics</span>
                  </div>
                  <p className="text-[7px] text-gray-400 line-clamp-2">Add quantifiable results to 60%+ of bullets</p>
                </div>
                {/* Locked blockers */}
                {[2, 3].map((n) => (
                  <div key={n} className="relative rounded-lg border border-gray-200 bg-white p-2 overflow-hidden">
                    <div className="mb-1 flex items-center gap-1">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[7px] font-bold text-blue-700">{n}</span>
                      <span className="text-[8px] font-semibold text-gray-900 truncate">Weak verbs</span>
                    </div>
                    <div className="absolute inset-0 z-10 flex items-end justify-center rounded-lg pb-2"
                      style={{ background: "linear-gradient(to bottom, transparent 5%, rgba(255,255,255,0.95) 30%, white 45%)" }}>
                      <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════ Step 3: Tailored CV (Pro Page) ══════ */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-700 ${step === 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
            <div className="mx-auto max-w-lg">
              {/* Header */}
              <div className="mb-1">
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-semibold text-white">Pro</span>
              </div>
              <p className="mb-3 text-sm font-bold text-gray-900">Your Full Tailor Pack</p>

              {/* Radar delta banner (mirrors real component) */}
              <div className="mb-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-gray-600">Before: <span className="font-bold text-gray-900">47</span></div>
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-[10px]">
                    New Match: <span className="text-xl font-bold text-green-700">84</span>
                    <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">+37</span>
                  </div>
                  <span className="ml-auto text-[9px] font-semibold text-green-700">Strong Match</span>
                </div>
              </div>

              {/* Tab navigation (mirrors real tabs) */}
              <div className="mb-3 flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {["Tailored Resume", "Cover Letter", "Keywords", "Feedback"].map((tab, i) => (
                  <span key={tab} className={`flex-1 rounded-md px-1.5 py-1 text-center text-[8px] sm:text-[9px] font-medium ${i === 0 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{tab}</span>
                ))}
              </div>

              {/* Mini resume preview (mirrors edit mode) */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                {/* Name + headline */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[7px] font-medium text-gray-500 uppercase">Name</span>
                    <div className="mt-0.5 rounded border border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-800">Sarah Chen</div>
                  </div>
                  <div>
                    <span className="text-[7px] font-medium text-gray-500 uppercase">Headline</span>
                    <div className="mt-0.5 rounded border border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-800">Senior Full-Stack Engineer</div>
                  </div>
                </div>

                {/* Experience card (mirrors real component with blue left border) */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1">
                    <span className="h-3 w-0.5 rounded-full bg-blue-500" />
                    <span className="text-[8px] font-semibold text-gray-700 uppercase">Experience</span>
                  </div>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <div className="w-0.5 shrink-0 bg-blue-500" />
                    <div className="flex-1 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-[7px] font-bold text-blue-600">A</div>
                        <div>
                          <span className="text-[8px] font-semibold text-gray-900">Tech Lead</span>
                          <span className="ml-1 text-[8px] text-gray-500">Acme Corp</span>
                        </div>
                        <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[7px] text-gray-500">2021–Present</span>
                      </div>
                      <div className="space-y-0.5">
                        {[
                          "Led migration of monolith to microservices, reducing deploy time by 73%",
                          "Mentored team of 8 engineers across 3 cross-functional squads",
                        ].map((bullet, i) => (
                          <div key={i} className="flex gap-1">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                            <span className="text-[7px] sm:text-[8px] text-gray-700 leading-tight">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <span className="h-3 w-0.5 rounded-full bg-green-500" />
                    <span className="text-[8px] font-semibold text-gray-700 uppercase">Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {["React", "Node.js", "Python", "Kubernetes", "GraphQL", "AWS", "CI/CD"].map((skill) => (
                      <span key={skill} className="rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[7px] sm:text-[8px] text-gray-700">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky download bar (mirrors real StickyActionBar) */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">Match: 84 <span className="text-green-600">(+37)</span></span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded border border-gray-300 px-2 py-1 text-[8px] font-medium text-gray-600">Copy All</span>
                  <span className="rounded-l bg-blue-600 px-2.5 py-1 text-[8px] font-semibold text-white">Download</span>
                  <span className="rounded-r border-l border-blue-500 bg-blue-600 px-1 py-1 text-[8px] text-white">
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
