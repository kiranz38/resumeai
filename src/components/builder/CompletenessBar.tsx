"use client";

import type { DocResume } from "@/lib/pro-document";

interface CompletenessBarProps {
  resume: DocResume;
  onQuickScan?: () => void;
}

interface Section {
  label: string;
  done: boolean;
  detail: string;
}

function computeSections(r: DocResume): Section[] {
  // Contact
  const hasName = !!r.name?.trim();
  const hasEmail = !!r.email?.trim();
  const contactDone = hasName && hasEmail;
  const contactParts: string[] = [];
  if (hasName) contactParts.push("name");
  if (hasEmail) contactParts.push("email");
  if (r.phone?.trim()) contactParts.push("phone");
  if (r.location?.trim()) contactParts.push("location");

  // Experience
  const expCount = r.experience.filter((e) => e.company.trim() || e.title.trim()).length;
  const totalBullets = r.experience.reduce(
    (sum, e) => sum + e.bullets.filter((b) => b.trim()).length,
    0,
  );
  const expDone = expCount > 0 && totalBullets > 0;

  // Education
  const eduList = r.education || [];
  const eduCount = eduList.filter((e) => e.school.trim()).length;
  const eduDone = eduCount > 0;

  // Skills
  const filledGroups = r.skills.groups.filter(
    (g) => g.label.trim() && g.items.some((i) => i.trim()),
  ).length;
  const skillsDone = filledGroups > 0;

  // Summary
  const summaryDone = !!(r.summary && r.summary.trim().length >= 20);

  return [
    {
      label: "Contact",
      done: contactDone,
      detail: contactDone
        ? `${contactParts.length} fields`
        : hasName
          ? "Add email"
          : "Add name & email",
    },
    {
      label: "Experience",
      done: expDone,
      detail: expDone
        ? `${expCount} role${expCount !== 1 ? "s" : ""}, ${totalBullets} bullet${totalBullets !== 1 ? "s" : ""}`
        : expCount > 0
          ? "Add bullets"
          : "Add a role",
    },
    {
      label: "Education",
      done: eduDone,
      detail: eduDone ? `${eduCount} entr${eduCount !== 1 ? "ies" : "y"}` : "Add education",
    },
    {
      label: "Skills",
      done: skillsDone,
      detail: skillsDone
        ? `${filledGroups} group${filledGroups !== 1 ? "s" : ""}`
        : "Add skills",
    },
    {
      label: "Summary",
      done: summaryDone,
      detail: summaryDone
        ? `${r.summary!.trim().length} chars`
        : "Add summary",
    },
  ];
}

export default function CompletenessBar({ resume, onQuickScan }: CompletenessBarProps) {
  const sections = computeSections(resume);
  const doneCount = sections.filter((s) => s.done).length;
  const pct = Math.round((doneCount / sections.length) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header + percentage */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Resume Completeness</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            pct === 100
              ? "bg-green-100 text-green-700"
              : pct >= 60
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            pct === 100 ? "bg-green-500" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Section checklist */}
      <div className="space-y-1.5">
        {sections.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            {s.done ? (
              <svg
                className="h-3.5 w-3.5 shrink-0 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-gray-300" />
            )}
            <span
              className={`text-[11px] font-medium ${
                s.done ? "text-gray-500" : "text-gray-700"
              }`}
            >
              {s.label}
            </span>
            <span className="ml-auto text-[10px] text-gray-400">{s.detail}</span>
          </div>
        ))}
      </div>

      {/* Completion message + Quick Scan CTA */}
      {pct === 100 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2">
            <svg
              className="h-4 w-4 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] font-medium text-green-700">
              All sections complete — ready to export!
            </p>
          </div>
          {onQuickScan && (
            <button
              onClick={onQuickScan}
              className="flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-left transition-colors hover:bg-blue-100"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800">Quick Scan your resume</p>
                <p className="text-[10px] text-gray-500">See how you score against real market roles — free</p>
              </div>
              <svg className="ml-auto h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
