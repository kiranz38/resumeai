"use client";

import type { ProOutput } from "./schema";

const SESSION_KEY = "rt_pro_result";
const EDIT_PREFIX = "rt_pro_edits_";

/**
 * Generate a short hash from a string for keying localStorage edits.
 */
function hashKey(data: string): string {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) - h + data.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function getEditKey(base: ProOutput): string {
  // Key by summary + first keyword to uniquely identify a generation
  const fingerprint = base.summary.slice(0, 100) + (base.keywordChecklist[0]?.keyword || "");
  return EDIT_PREFIX + hashKey(fingerprint);
}

/**
 * Load the base (generated) ProOutput from sessionStorage.
 */
export function loadBaseProOutput(): ProOutput | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProOutput;
  } catch {
    return null;
  }
}

/**
 * Save base ProOutput to sessionStorage.
 */
export function saveBaseProOutput(data: ProOutput): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Load edits overlay from localStorage.
 * Returns a partial ProOutput with only the changed fields.
 */
export function loadEdits(base: ProOutput): Partial<ProOutput> | null {
  if (typeof window === "undefined") return null;
  const key = getEditKey(base);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<ProOutput>;
  } catch {
    return null;
  }
}

/**
 * Save edits overlay to localStorage.
 */
export function saveEdits(base: ProOutput, edits: Partial<ProOutput>): void {
  if (typeof window === "undefined") return;
  const key = getEditKey(base);
  localStorage.setItem(key, JSON.stringify(edits));
}

/**
 * Clear edits overlay (reset to generated).
 */
export function clearEdits(base: ProOutput): void {
  if (typeof window === "undefined") return;
  const key = getEditKey(base);
  localStorage.removeItem(key);
}

/**
 * Merge base ProOutput with edits overlay to produce the current state.
 */
export function mergeProOutput(base: ProOutput, edits: Partial<ProOutput> | null): ProOutput {
  if (!edits) return base;

  return {
    summary: edits.summary ?? base.summary,
    tailoredResume: edits.tailoredResume
      ? {
          name: edits.tailoredResume.name ?? base.tailoredResume.name,
          headline: edits.tailoredResume.headline ?? base.tailoredResume.headline,
          summary: edits.tailoredResume.summary ?? base.tailoredResume.summary,
          skills: edits.tailoredResume.skills ?? base.tailoredResume.skills,
          experience: edits.tailoredResume.experience ?? base.tailoredResume.experience,
          education: edits.tailoredResume.education ?? base.tailoredResume.education,
        }
      : base.tailoredResume,
    coverLetter: edits.coverLetter ?? base.coverLetter,
    keywordChecklist: edits.keywordChecklist ?? base.keywordChecklist,
    recruiterFeedback: edits.recruiterFeedback ?? base.recruiterFeedback,
    bulletRewrites: edits.bulletRewrites ?? base.bulletRewrites,
    experienceGaps: edits.experienceGaps ?? base.experienceGaps,
    nextActions: edits.nextActions ?? base.nextActions,
  };
}

/**
 * Check if edits differ from the base (dirty state).
 */
export function isDirty(base: ProOutput, edits: Partial<ProOutput> | null): boolean {
  if (!edits) return false;
  return JSON.stringify(mergeProOutput(base, edits)) !== JSON.stringify(base);
}

/**
 * Convert a structured ProOutput to plain text for TXT export.
 */
export function proOutputToText(output: ProOutput): string {
  const lines: string[] = [];

  // Resume
  lines.push("=== TAILORED RESUME ===");
  lines.push(output.tailoredResume.name.toUpperCase());
  lines.push(`${output.tailoredResume.headline}`);
  lines.push("");
  lines.push("PROFESSIONAL SUMMARY");
  lines.push(output.tailoredResume.summary);
  lines.push("");
  lines.push("EXPERIENCE");
  for (const exp of output.tailoredResume.experience) {
    lines.push(`${exp.title.toUpperCase()} — ${exp.company}${exp.period ? ` (${exp.period})` : ""}`);
    for (const bullet of exp.bullets) {
      lines.push(`  - ${bullet}`);
    }
    lines.push("");
  }
  lines.push("EDUCATION");
  for (const edu of output.tailoredResume.education) {
    lines.push(`${edu.degree} — ${edu.school}${edu.year ? `, ${edu.year}` : ""}`);
  }
  lines.push("");
  lines.push("SKILLS");
  for (const group of output.tailoredResume.skills) {
    lines.push(`${group.category}: ${group.items.join(", ")}`);
  }
  lines.push("");

  // Cover letter
  lines.push("=== COVER LETTER ===");
  for (const p of output.coverLetter.paragraphs) {
    lines.push(p);
    lines.push("");
  }

  // Recruiter feedback
  lines.push("=== RECRUITER FEEDBACK ===");
  for (const fb of output.recruiterFeedback) {
    lines.push(`- ${fb}`);
  }
  lines.push("");

  // Next actions
  lines.push("=== NEXT ACTIONS ===");
  output.nextActions.forEach((a, i) => {
    lines.push(`${i + 1}. ${a}`);
  });
  lines.push("");

  // Summary
  lines.push("=== SUMMARY ===");
  lines.push(output.summary);

  return lines.join("\n");
}
