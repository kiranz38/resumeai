"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Animated demo showcasing the Create Resume builder flow:
 *   1. Choose Template — cards appear one by one
 *   2. Fill Details — typing animation in form fields
 *   3. Live Preview — resume renders with typed data
 *   4. Export — download buttons + template switcher
 * Auto-advances every 5s. Clickable step dots.
 */
export default function CreateResumeDemo() {
  const [step, setStep] = useState(0);
  const [cardsRevealed, setCardsRevealed] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(-1);
  const [typedName, setTypedName] = useState("");
  const [typedTitle, setTypedTitle] = useState("");
  const [typedCompany, setTypedCompany] = useState("");
  const [typedRole, setTypedRole] = useState("");
  const [showBullets, setShowBullets] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [exportHighlight, setExportHighlight] = useState(-1);

  const TOTAL_STEPS = 4;

  const FULL_NAME = "Sarah Mitchell";
  const FULL_TITLE = "Senior Product Manager";
  const FULL_COMPANY = "Stripe";
  const FULL_ROLE = "Product Manager";

  // Auto-advance steps
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % TOTAL_STEPS);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Step 0: Template cards appear, then one gets selected
  useEffect(() => {
    if (step === 0) {
      setCardsRevealed(0);
      setSelectedTemplate(-1);
      const timers = TEMPLATES.map((_, i) =>
        setTimeout(() => setCardsRevealed(i + 1), 200 + i * 200)
      );
      timers.push(setTimeout(() => setSelectedTemplate(1), 200 + TEMPLATES.length * 200 + 400));
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  // Step 1: Type out form fields one by one
  const typeText = useCallback((full: string, setter: (v: string) => void, startDelay: number) => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i <= full.length; i++) {
      timers.push(setTimeout(() => setter(full.slice(0, i)), startDelay + i * 45));
    }
    return timers;
  }, []);

  useEffect(() => {
    if (step === 1) {
      setTypedName("");
      setTypedTitle("");
      setTypedCompany("");
      setTypedRole("");
      setShowBullets(0);

      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(...typeText(FULL_NAME, setTypedName, 300));
      const titleStart = 300 + FULL_NAME.length * 45 + 200;
      timers.push(...typeText(FULL_TITLE, setTypedTitle, titleStart));
      const companyStart = titleStart + FULL_TITLE.length * 45 + 200;
      timers.push(...typeText(FULL_COMPANY, setTypedCompany, companyStart));
      const roleStart = companyStart + FULL_COMPANY.length * 45 + 200;
      timers.push(...typeText(FULL_ROLE, setTypedRole, roleStart));
      const bulletStart = roleStart + FULL_ROLE.length * 45 + 200;
      timers.push(setTimeout(() => setShowBullets(1), bulletStart));
      timers.push(setTimeout(() => setShowBullets(2), bulletStart + 300));

      return () => timers.forEach(clearTimeout);
    }
  }, [step, typeText]);

  // Step 2: Preview fades in
  useEffect(() => {
    if (step === 2) {
      setPreviewReady(false);
      const t = setTimeout(() => setPreviewReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Step 3: Export buttons highlight sequentially
  useEffect(() => {
    if (step === 3) {
      setExportHighlight(-1);
      const timers = [
        setTimeout(() => setExportHighlight(0), 600),
        setTimeout(() => setExportHighlight(1), 1400),
        setTimeout(() => setExportHighlight(2), 2200),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  const urls = [
    "resumemate.ai/create",
    "resumemate.ai/create",
    "resumemate.ai/create",
    "resumemate.ai/create",
  ];

  const stepLabels = [
    { label: "Template", color: "bg-blue-500" },
    { label: "Fill", color: "bg-indigo-500" },
    { label: "Preview", color: "bg-blue-500" },
    { label: "Export", color: "bg-green-500" },
  ];

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
          <div className="ml-4 flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-400 transition-all duration-500">
            {urls[step]}
          </div>
        </div>

        {/* Screen content */}
        <div className="relative min-h-[340px] overflow-hidden bg-gray-50/30 sm:min-h-[380px]">
          {/* Step 0: Choose Template */}
          <div
            className={`absolute inset-0 p-4 transition-all duration-700 sm:p-6 ${
              step === 0
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 pointer-events-none opacity-0"
            }`}
          >
            <div className="mx-auto max-w-md">
              <div className="mb-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Step 1 of 6
                </p>
                <p className="text-xs font-bold text-gray-900 sm:text-sm">
                  Choose a Template
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TEMPLATES.map((t, i) => (
                  <div
                    key={t.name}
                    className={`rounded-lg border-2 bg-white p-1.5 transition-all duration-500 ${
                      i < cardsRevealed
                        ? "translate-y-0 opacity-100"
                        : "translate-y-3 opacity-0"
                    } ${
                      selectedTemplate === i
                        ? "border-primary shadow-md ring-2 ring-primary/20"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Mini resume skeleton */}
                    <div className="aspect-[3/4] rounded bg-gray-50 p-1.5">
                      {/* Name bar */}
                      <div
                        className={`mx-auto mb-1 h-1 w-10 rounded-full ${
                          selectedTemplate === i ? "bg-primary" : "bg-gray-300"
                        }`}
                      />
                      <div className="mx-auto mb-1.5 h-0.5 w-7 rounded-full bg-gray-200" />
                      {/* Section bars */}
                      {t.lines.map((w, j) => (
                        <div
                          key={j}
                          className="mb-0.5 rounded-full bg-gray-200"
                          style={{ width: w, height: 2 }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-center text-[7px] font-medium text-gray-600">
                      {t.name}
                    </p>
                    {selectedTemplate === i && (
                      <div className="mt-0.5 flex justify-center">
                        <svg
                          className="h-3 w-3 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Next button */}
              <div className="mt-3 flex justify-end">
                <span
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold text-white transition-all duration-500 ${
                    selectedTemplate >= 0
                      ? "bg-primary shadow-sm"
                      : "bg-gray-300"
                  }`}
                >
                  Next &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Fill Details */}
          <div
            className={`absolute inset-0 p-4 transition-all duration-700 sm:p-6 ${
              step === 1
                ? "translate-x-0 opacity-100"
                : "translate-x-8 pointer-events-none opacity-0"
            }`}
          >
            <div className="mx-auto max-w-md">
              {/* Step dots */}
              <div className="mb-3 flex items-center justify-center gap-1">
                {["Contact", "Experience", "Skills"].map((l, i) => (
                  <span
                    key={l}
                    className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${
                      i === 0
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {l}
                  </span>
                ))}
              </div>

              {/* Contact form */}
              <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-[9px] font-bold text-gray-700">
                  Contact Information
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[7px] font-medium text-gray-500">
                      Full Name
                    </label>
                    <div className="flex items-center rounded border border-gray-300 bg-white px-2 py-1.5">
                      <span className="text-[9px] text-gray-900">
                        {typedName}
                      </span>
                      <span className="ml-px h-3 w-px animate-pulse bg-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[7px] font-medium text-gray-500">
                      Headline
                    </label>
                    <div className="flex items-center rounded border border-gray-300 bg-white px-2 py-1.5">
                      <span className="text-[9px] text-gray-900">
                        {typedTitle}
                      </span>
                      {typedName.length === FULL_NAME.length && (
                        <span className="ml-px h-3 w-px animate-pulse bg-primary" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience section */}
                <div className="mt-1 border-t border-gray-100 pt-2">
                  <p className="text-[9px] font-bold text-gray-700">
                    Experience
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-[7px] font-medium text-gray-500">
                        Company
                      </label>
                      <div className="flex items-center rounded border border-gray-300 bg-white px-2 py-1.5">
                        <span className="text-[9px] text-gray-900">
                          {typedCompany}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[7px] font-medium text-gray-500">
                        Job Title
                      </label>
                      <div className="flex items-center rounded border border-gray-300 bg-white px-2 py-1.5">
                        <span className="text-[9px] text-gray-900">
                          {typedRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bullets appearing */}
                  <div className="mt-1.5 space-y-1">
                    {DEMO_BULLETS.map((b, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-1 transition-all duration-400 ${
                          i < showBullets
                            ? "translate-y-0 opacity-100"
                            : "translate-y-1 opacity-0"
                        }`}
                      >
                        <span className="mt-0.5 text-[7px] text-gray-400">
                          &bull;
                        </span>
                        <span className="text-[8px] leading-snug text-gray-600">
                          {b}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Live Preview */}
          <div
            className={`absolute inset-0 p-3 transition-all duration-700 sm:p-4 ${
              step === 2
                ? "translate-x-0 opacity-100"
                : "translate-x-8 pointer-events-none opacity-0"
            }`}
          >
            <div className="mx-auto max-w-lg">
              {/* Side-by-side layout label */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[8px] font-semibold text-green-700">
                    Live Preview
                  </span>
                  <span className="text-[9px] text-gray-400">
                    Updates as you type
                  </span>
                </div>
                <span className="text-[8px] text-gray-400">
                  Classic Professional
                </span>
              </div>

              {/* Resume preview */}
              <div
                className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-700 ${
                  previewReady
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                {/* Header */}
                <div className="border-b border-gray-200 px-4 py-3 text-center">
                  <p className="text-sm font-bold tracking-wide text-gray-900 sm:text-base">
                    SARAH MITCHELL
                  </p>
                  <p className="mt-0.5 text-[9px] text-gray-500 sm:text-[10px]">
                    Senior Product Manager
                  </p>
                  <p className="mt-0.5 text-[8px] text-gray-400">
                    sarah.mitchell@email.com &middot; (555) 123-4567 &middot;
                    San Francisco, CA
                  </p>
                </div>

                {/* Summary */}
                <div className="border-b border-gray-50 px-4 py-2">
                  <p className="mb-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-700">
                    Summary
                  </p>
                  <p className="text-[8px] leading-snug text-gray-600 sm:text-[9px]">
                    Results-driven product manager with 8+ years leading
                    cross-functional teams. Expert in agile methodologies, data
                    analytics, and go-to-market strategy.
                  </p>
                </div>

                {/* Experience */}
                <div className="border-b border-gray-50 px-4 py-2">
                  <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-gray-700">
                    Experience
                  </p>
                  <div className="mb-1.5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-[9px] font-semibold text-gray-900 sm:text-[10px]">
                        Senior Product Manager
                      </p>
                      <p className="text-[7px] text-gray-400">
                        2020 &ndash; Present
                      </p>
                    </div>
                    <p className="text-[8px] font-medium text-primary">
                      Stripe &middot; San Francisco, CA
                    </p>
                    <ul className="mt-0.5 space-y-0.5">
                      <li className="flex gap-1 text-[8px] leading-snug text-gray-600 sm:text-[9px]">
                        <span className="shrink-0 text-gray-400">&bull;</span>
                        <span>
                          Led product strategy for payments platform serving 2M+
                          merchants
                        </span>
                      </li>
                      <li className="flex gap-1 text-[8px] leading-snug text-gray-600 sm:text-[9px]">
                        <span className="shrink-0 text-gray-400">&bull;</span>
                        <span>
                          Drove 34% increase in enterprise adoption through
                          feature roadmap
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-[9px] font-semibold text-gray-900 sm:text-[10px]">
                        Product Manager
                      </p>
                      <p className="text-[7px] text-gray-400">
                        2017 &ndash; 2020
                      </p>
                    </div>
                    <p className="text-[8px] font-medium text-primary">
                      Airbnb &middot; San Francisco, CA
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div className="px-4 py-2">
                  <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-gray-700">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Product Strategy",
                      "Agile / Scrum",
                      "SQL",
                      "Figma",
                      "A/B Testing",
                      "Roadmapping",
                      "Stakeholder Mgmt",
                    ].map((s) => (
                      <span
                        key={s}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-[7px] font-medium text-gray-600 sm:text-[8px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Export — full resume + download */}
          <div
            className={`absolute inset-0 p-3 transition-all duration-700 sm:p-4 ${
              step === 3
                ? "translate-x-0 opacity-100"
                : "translate-x-8 pointer-events-none opacity-0"
            }`}
          >
            <div className="mx-auto max-w-lg">
              {/* Header row */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 sm:text-xs">Your resume is ready!</p>
                </div>
                <span className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[8px] font-medium text-gray-600">
                  Classic Professional
                </span>
              </div>

              {/* Full resume document preview */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                {/* Resume header */}
                <div className="border-b border-gray-200 px-4 py-2.5 text-center">
                  <p className="text-sm font-bold tracking-wide text-gray-900">SARAH MITCHELL</p>
                  <p className="mt-0.5 text-[9px] text-gray-500">Senior Product Manager</p>
                  <p className="text-[7px] text-gray-400">sarah.mitchell@email.com &middot; (555) 123-4567 &middot; San Francisco, CA &middot; linkedin.com/in/sarahmitchell</p>
                </div>
                {/* Summary */}
                <div className="border-b border-gray-50 px-4 py-1.5">
                  <p className="mb-0.5 text-[7px] font-bold uppercase tracking-wider text-gray-700">Summary</p>
                  <p className="text-[7px] leading-snug text-gray-600">Results-driven product manager with 8+ years leading cross-functional teams. Expert in agile methodologies, data analytics, and go-to-market strategy.</p>
                </div>
                {/* Experience */}
                <div className="border-b border-gray-50 px-4 py-1.5">
                  <p className="mb-0.5 text-[7px] font-bold uppercase tracking-wider text-gray-700">Experience</p>
                  <div className="mb-1">
                    <div className="flex items-baseline justify-between">
                      <p className="text-[8px] font-semibold text-gray-900">Senior Product Manager</p>
                      <p className="text-[6px] text-gray-400">2020 &ndash; Present</p>
                    </div>
                    <p className="text-[7px] font-medium text-primary">Stripe &middot; San Francisco, CA</p>
                    <ul className="mt-0.5 space-y-0.5">
                      <li className="flex gap-1 text-[7px] leading-snug text-gray-600">
                        <span className="shrink-0 text-gray-400">&bull;</span>
                        <span>Led product strategy for payments platform serving 2M+ merchants globally</span>
                      </li>
                      <li className="flex gap-1 text-[7px] leading-snug text-gray-600">
                        <span className="shrink-0 text-gray-400">&bull;</span>
                        <span>Drove 34% increase in enterprise adoption through strategic feature roadmap</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-[8px] font-semibold text-gray-900">Product Manager</p>
                      <p className="text-[6px] text-gray-400">2017 &ndash; 2020</p>
                    </div>
                    <p className="text-[7px] font-medium text-primary">Airbnb &middot; San Francisco, CA</p>
                    <ul className="mt-0.5 space-y-0.5">
                      <li className="flex gap-1 text-[7px] leading-snug text-gray-600">
                        <span className="shrink-0 text-gray-400">&bull;</span>
                        <span>Launched host pricing tool that increased bookings by 22%</span>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Education + Skills row */}
                <div className="flex gap-0 divide-x divide-gray-50">
                  <div className="flex-1 px-4 py-1.5">
                    <p className="mb-0.5 text-[7px] font-bold uppercase tracking-wider text-gray-700">Education</p>
                    <p className="text-[7px] font-semibold text-gray-900">MBA, Business Administration</p>
                    <p className="text-[6px] text-gray-500">Stanford University &middot; 2017</p>
                  </div>
                  <div className="flex-1 px-4 py-1.5">
                    <p className="mb-0.5 text-[7px] font-bold uppercase tracking-wider text-gray-700">Skills</p>
                    <div className="flex flex-wrap gap-0.5">
                      {["Product Strategy", "Agile", "SQL", "Figma", "A/B Testing", "Roadmapping"].map((s) => (
                        <span key={s} className="rounded bg-gray-100 px-1 py-0.5 text-[6px] font-medium text-gray-600">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export action bar */}
              <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  {EXPORT_BUTTONS.map((btn, i) => (
                    <span
                      key={btn.label}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[9px] font-semibold transition-all duration-500 ${
                        exportHighlight === i
                          ? `${btn.activeClass} scale-105 shadow-sm`
                          : "border border-gray-200 bg-white text-gray-500"
                      }`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {btn.label}
                    </span>
                  ))}
                </div>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[8px] font-medium text-blue-600">
                  Free to build &middot; Export from $5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator bar */}
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2.5 sm:gap-3">
          {stepLabels.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-all duration-300 sm:px-3 sm:text-xs ${
                step === i
                  ? `${s.color} text-white shadow-sm`
                  : i < step
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}
            >
              {i < step && (
                <svg
                  className="h-2.5 w-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {step === i && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Demo data ── */

const TEMPLATES = [
  { name: "Modern ATS", lines: ["80%", "65%", "90%", "70%", "55%", "85%"] },
  { name: "Classic Pro", lines: ["75%", "90%", "60%", "80%", "70%", "55%"] },
  { name: "Minimalist", lines: ["60%", "85%", "50%", "75%", "90%", "40%"] },
  { name: "Two-Column", lines: ["70%", "55%", "85%", "65%", "75%", "60%"] },
  { name: "Executive", lines: ["85%", "70%", "60%", "90%", "50%", "75%"] },
  { name: "Creative", lines: ["65%", "80%", "75%", "55%", "85%", "70%"] },
  { name: "Compact", lines: ["90%", "75%", "85%", "70%", "60%", "80%"] },
  { name: "Simple Clean", lines: ["70%", "60%", "80%", "75%", "65%", "55%"] },
];

const DEMO_BULLETS = [
  "Led product strategy for payments platform serving 2M+ merchants globally",
  "Drove 34% increase in enterprise adoption through strategic feature roadmap",
];

const EXPORT_BUTTONS = [
  { label: "PDF", activeClass: "bg-blue-600 text-white" },
  { label: "DOCX", activeClass: "bg-indigo-600 text-white" },
  { label: "TXT", activeClass: "bg-gray-800 text-white" },
];
