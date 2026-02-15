/**
 * QualityGate — final check and auto-fix pass on ProOutput.
 *
 * Orchestrates:
 * 1. Bullet deduplication (dedupe-bullets)
 * 2. Consistency validation (consistency-validator)
 * 3. Filler phrase removal
 * 4. Cover letter structure checks
 *
 * Runs deterministically — no LLM call.
 */

import type { ProOutput } from "./schema";
import { dedupeProOutput } from "./dedupe-bullets";
import { validateConsistency } from "./consistency-validator";

// ── Filler phrases that should never appear ──

const FILLER_PHRASES = [
  "resulting in measurable performance improvements",
  "resulting in measurable improvements",
  "measurable performance improvements",
  "in a dynamic environment",
  "in a fast-paced environment",
  "leveraging best practices",
  "utilizing industry best practices",
  "spearheaded synergies",
  "drove alignment across",
  "in cross-functional collaboration with stakeholders",
];

// ── Types ──

export interface QualityIssue {
  type: "filler" | "duplicate_bullet" | "duplicate_greeting" | "contradiction" | "weak_bullet";
  location: string;
  detail: string;
  autoFixed: boolean;
}

export interface QualityResult {
  output: ProOutput;
  issues: QualityIssue[];
  passed: boolean;
}

// ── Main gate ──

/**
 * Run the full quality gate pipeline on a ProOutput.
 * Returns the fixed output and a list of issues found (with autoFixed flags).
 */
export function runQualityGate(output: ProOutput): QualityResult {
  const issues: QualityIssue[] = [];

  // Step 1: Deduplicate bullets + cover letter greetings
  let fixed = dedupeProOutput(output);

  // Track bullet dedup changes
  for (let i = 0; i < output.tailoredResume.experience.length; i++) {
    const origCount = output.tailoredResume.experience[i].bullets.length;
    const newCount = fixed.tailoredResume.experience[i]?.bullets.length ?? 0;
    if (newCount < origCount) {
      issues.push({
        type: "duplicate_bullet",
        location: `experience[${i}] (${output.tailoredResume.experience[i].company})`,
        detail: `Removed ${origCount - newCount} duplicate/near-duplicate bullet(s)`,
        autoFixed: true,
      });
    }
  }

  // Track cover letter greeting dedup
  if (fixed.coverLetter.paragraphs.length < output.coverLetter.paragraphs.length) {
    issues.push({
      type: "duplicate_greeting",
      location: "coverLetter",
      detail: `Removed ${output.coverLetter.paragraphs.length - fixed.coverLetter.paragraphs.length} duplicate greeting/signoff(s)`,
      autoFixed: true,
    });
  }

  // Step 2: Remove filler phrases from bullets
  fixed = removeFiller(fixed, issues);

  // Step 3: Validate consistency (insights vs tailored resume)
  const preConsistency = { ...fixed };
  fixed = validateConsistency(fixed);

  // Track consistency fixes
  const kwFlipped = fixed.keywordChecklist.filter(
    (kw, i) => kw.found && !preConsistency.keywordChecklist[i]?.found
  );
  if (kwFlipped.length > 0) {
    issues.push({
      type: "contradiction",
      location: "keywordChecklist",
      detail: `Fixed ${kwFlipped.length} keyword(s) marked missing but present in tailored resume: ${kwFlipped.map((k) => k.keyword).join(", ")}`,
      autoFixed: true,
    });
  }

  const gapsRemoved = preConsistency.experienceGaps.length - fixed.experienceGaps.length;
  if (gapsRemoved > 0) {
    issues.push({
      type: "contradiction",
      location: "experienceGaps",
      detail: `Removed ${gapsRemoved} gap(s) that contradict the tailored resume`,
      autoFixed: true,
    });
  }

  const feedbackRemoved = preConsistency.recruiterFeedback.length - fixed.recruiterFeedback.length;
  if (feedbackRemoved > 0) {
    issues.push({
      type: "contradiction",
      location: "recruiterFeedback",
      detail: `Removed ${feedbackRemoved} contradictory feedback line(s)`,
      autoFixed: true,
    });
  }

  return {
    output: fixed,
    issues,
    passed: issues.length === 0,
  };
}

// ── Filler removal ──

function removeFiller(output: ProOutput, issues: QualityIssue[]): ProOutput {
  const experience = output.tailoredResume.experience.map((entry, i) => {
    const bullets = entry.bullets.map((bullet) => {
      let cleaned = bullet;
      for (const filler of FILLER_PHRASES) {
        if (cleaned.toLowerCase().includes(filler.toLowerCase())) {
          // Remove the filler phrase, clean up punctuation
          const regex = new RegExp(`,?\\s*${escapeRegExp(filler)}`, "gi");
          cleaned = cleaned.replace(regex, "").replace(/\s+/g, " ").replace(/\s+\.$/, ".").trim();
          issues.push({
            type: "filler",
            location: `experience[${i}].bullets`,
            detail: `Removed filler: "${filler}"`,
            autoFixed: true,
          });
        }
      }
      return cleaned;
    });
    return { ...entry, bullets };
  });

  return {
    ...output,
    tailoredResume: {
      ...output.tailoredResume,
      experience,
    },
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
