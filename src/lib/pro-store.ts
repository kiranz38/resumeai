"use client";

import type { ProOutput } from "./schema";
import { proOutputToDocument, proDocumentToText } from "./pro-document";

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
 * Delegates to the canonical proDocumentToText formatter.
 */
export function proOutputToText(output: ProOutput): string {
  const doc = proOutputToDocument(output);
  return proDocumentToText(doc);
}
