/**
 * localStorage persistence for the scratch resume builder.
 * Auto-saves DocResume and selected template with debouncing.
 */

import type { DocResume } from "./pro-document";
import { EMPTY_RESUME } from "./resume-reducer";

const RESUME_KEY = "rt_scratch_resume";
const TEMPLATE_KEY = "rt_scratch_template";

// ── Resume persistence ──

export function loadScratchResume(): DocResume {
  if (typeof window === "undefined") return EMPTY_RESUME;
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return EMPTY_RESUME;
    const parsed = JSON.parse(raw);
    // Merge with empty resume to ensure all fields exist
    return { ...EMPTY_RESUME, ...parsed };
  } catch {
    return EMPTY_RESUME;
  }
}

export function saveScratchResume(resume: DocResume): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(resume));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearScratchResume(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RESUME_KEY);
}

// ── Template persistence ──

export function loadScratchTemplate(): string {
  if (typeof window === "undefined") return "modern-ats";
  return localStorage.getItem(TEMPLATE_KEY) || "modern-ats";
}

export function saveScratchTemplate(templateId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATE_KEY, templateId);
  } catch {
    // silently ignore
  }
}

// ── Debounced save helper ──

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(resume: DocResume, delayMs = 500): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveScratchResume(resume), delayMs);
}
