/**
 * QualityGate — hard quality gate + auto-fix pass on ProOutput.
 *
 * Orchestrates:
 * 1. Bullet deduplication (dedupe-bullets)
 * 2. Banned phrase removal across ALL sections
 * 3. Dangling bullet fix (trailing clauses with no outcome)
 * 4. Cover letter structure enforcement (4 paragraphs, 1 greeting, 1 signoff)
 * 5. Skills validation (no sentences in skill items)
 * 6. Consistency validation (consistency-validator)
 *
 * Runs deterministically — no LLM call.
 */

import type { ProOutput } from "./schema";
import { dedupeProOutput } from "./dedupe-bullets";
import { validateConsistency } from "./consistency-validator";
import {
  BANNED_PHRASES,
  DANGLING_ENDINGS,
  COVER_LETTER_RULES,
  PROMPT_VERSION,
} from "./llm/prompts";

// ── Types ──

export interface QualityIssue {
  type:
    | "filler"
    | "duplicate_bullet"
    | "duplicate_greeting"
    | "contradiction"
    | "weak_bullet"
    | "dangling_bullet"
    | "cover_letter_structure"
    | "skills_sentence"
    | "banned_phrase";
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

  // Step 2: Remove banned phrases from ALL sections
  fixed = removeBannedPhrases(fixed, issues);

  // Step 3: Fix dangling bullets
  fixed = fixDanglingBullets(fixed, issues);

  // Step 4: Enforce cover letter structure
  fixed = enforceCoverLetterStructure(fixed, issues);

  // Step 5: Validate skills (no sentences in skill items)
  fixed = validateSkills(fixed, issues);

  // Step 6: Validate consistency (insights vs tailored resume)
  const preConsistency = { ...fixed };
  fixed = validateConsistency(fixed);

  // Track consistency fixes
  const kwFlipped = fixed.keywordChecklist.filter(
    (kw, i) => kw.found && !preConsistency.keywordChecklist[i]?.found,
  );
  if (kwFlipped.length > 0) {
    issues.push({
      type: "contradiction",
      location: "keywordChecklist",
      detail: `Fixed ${kwFlipped.length} keyword(s) marked missing but present in tailored resume: ${kwFlipped.map((k) => k.keyword).join(", ")}`,
      autoFixed: true,
    });
  }

  const gapsRemoved =
    preConsistency.experienceGaps.length - fixed.experienceGaps.length;
  if (gapsRemoved > 0) {
    issues.push({
      type: "contradiction",
      location: "experienceGaps",
      detail: `Removed ${gapsRemoved} gap(s) that contradict the tailored resume`,
      autoFixed: true,
    });
  }

  const feedbackRemoved =
    preConsistency.recruiterFeedback.length - fixed.recruiterFeedback.length;
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

// ── Banned phrase removal (ALL sections) ──

function removeBannedPhrases(
  output: ProOutput,
  issues: QualityIssue[],
): ProOutput {
  // Helper: clean a single string of banned phrases
  function cleanText(text: string, location: string): string {
    let cleaned = text;
    for (const phrase of BANNED_PHRASES) {
      if (cleaned.toLowerCase().includes(phrase.toLowerCase())) {
        const regex = new RegExp(`,?\\s*${escapeRegExp(phrase)}`, "gi");
        cleaned = cleaned
          .replace(regex, "")
          .replace(/\s+/g, " ")
          .replace(/\s+\.$/, ".")
          .trim();
        issues.push({
          type: "banned_phrase",
          location,
          detail: `Removed banned phrase: "${phrase}"`,
          autoFixed: true,
        });
      }
    }
    return cleaned;
  }

  // Clean experience bullets
  const experience = output.tailoredResume.experience.map((entry, i) => ({
    ...entry,
    bullets: entry.bullets.map((b) =>
      cleanText(b, `experience[${i}].bullets`),
    ),
  }));

  // Clean summary
  const summary = cleanText(
    output.tailoredResume.summary,
    "tailoredResume.summary",
  );

  // Clean cover letter paragraphs
  const coverParagraphs = output.coverLetter.paragraphs.map((p, i) =>
    cleanText(p, `coverLetter.paragraphs[${i}]`),
  );

  // Clean recruiter feedback
  const recruiterFeedback = output.recruiterFeedback.map((line, i) =>
    cleanText(line, `recruiterFeedback[${i}]`),
  );

  // Clean next actions
  const nextActions = output.nextActions.map((a, i) =>
    cleanText(a, `nextActions[${i}]`),
  );

  // Clean output summary
  const outputSummary = cleanText(output.summary, "summary");

  return {
    ...output,
    summary: outputSummary,
    tailoredResume: {
      ...output.tailoredResume,
      summary,
      experience,
    },
    coverLetter: { paragraphs: coverParagraphs },
    recruiterFeedback,
    nextActions,
  };
}

// ── Dangling bullet fix ──

function fixDanglingBullets(
  output: ProOutput,
  issues: QualityIssue[],
): ProOutput {
  const experience = output.tailoredResume.experience.map((entry, i) => ({
    ...entry,
    bullets: entry.bullets.map((bullet) => {
      for (const pattern of DANGLING_ENDINGS) {
        if (pattern.test(bullet)) {
          // Remove the dangling clause
          const fixed = bullet
            .replace(pattern, ".")
            .replace(/\s+\./g, ".")
            .replace(/\.\./g, ".")
            .trim();
          issues.push({
            type: "dangling_bullet",
            location: `experience[${i}].bullets`,
            detail: `Fixed dangling ending in: "${bullet.slice(-40)}"`,
            autoFixed: true,
          });
          return fixed;
        }
      }
      return bullet;
    }),
  }));

  return {
    ...output,
    tailoredResume: {
      ...output.tailoredResume,
      experience,
    },
  };
}

// ── Cover letter structure enforcement ──

function enforceCoverLetterStructure(
  output: ProOutput,
  issues: QualityIssue[],
): ProOutput {
  let paragraphs = [...output.coverLetter.paragraphs];

  // Filter empty paragraphs
  paragraphs = paragraphs.filter((p) => p.trim().length > 0);

  // Ensure only one greeting (first paragraph)
  const { greetingPattern, signoffPattern, maxParagraphs } =
    COVER_LETTER_RULES;
  let greetingCount = 0;
  paragraphs = paragraphs.filter((p, i) => {
    if (greetingPattern.test(p.trim())) {
      greetingCount++;
      if (greetingCount > 1) {
        issues.push({
          type: "cover_letter_structure",
          location: `coverLetter.paragraphs[${i}]`,
          detail: "Removed duplicate greeting",
          autoFixed: true,
        });
        return false;
      }
    }
    return true;
  });

  // Ensure only one signoff (last paragraph)
  let signoffCount = 0;
  const reversed = [...paragraphs].reverse();
  const signoffFiltered = reversed.filter((p, i) => {
    if (signoffPattern.test(p.trim())) {
      signoffCount++;
      if (signoffCount > 1) {
        issues.push({
          type: "cover_letter_structure",
          location: `coverLetter.paragraphs[${paragraphs.length - 1 - i}]`,
          detail: "Removed duplicate signoff",
          autoFixed: true,
        });
        return false;
      }
    }
    return true;
  });
  paragraphs = signoffFiltered.reverse();

  // Cap at max paragraphs (merge excess body paragraphs)
  if (paragraphs.length > maxParagraphs) {
    // Keep greeting (first), signoff (last), merge middle
    const greeting = greetingPattern.test(paragraphs[0].trim())
      ? paragraphs[0]
      : null;
    const signoff = signoffPattern.test(
      paragraphs[paragraphs.length - 1].trim(),
    )
      ? paragraphs[paragraphs.length - 1]
      : null;

    const bodyStart = greeting ? 1 : 0;
    const bodyEnd = signoff ? paragraphs.length - 1 : paragraphs.length;
    const bodyParagraphs = paragraphs.slice(bodyStart, bodyEnd);

    // Keep only first (maxParagraphs - 2) body paragraphs
    const maxBody = maxParagraphs - (greeting ? 1 : 0) - (signoff ? 1 : 0);
    const trimmedBody = bodyParagraphs.slice(0, maxBody);

    paragraphs = [
      ...(greeting ? [greeting] : []),
      ...trimmedBody,
      ...(signoff ? [signoff] : []),
    ];

    issues.push({
      type: "cover_letter_structure",
      location: "coverLetter",
      detail: `Trimmed cover letter from ${output.coverLetter.paragraphs.length} to ${paragraphs.length} paragraphs`,
      autoFixed: true,
    });
  }

  return {
    ...output,
    coverLetter: { paragraphs },
  };
}

// ── Skills validation ──

function validateSkills(
  output: ProOutput,
  issues: QualityIssue[],
): ProOutput {
  const skills = output.tailoredResume.skills.map((group) => ({
    ...group,
    items: group.items
      .map((item) => {
        // Skills should be short labels (1-4 words typically), not sentences
        const trimmed = item.trim();
        if (trimmed.length > 50 || trimmed.split(/\s+/).length > 6) {
          issues.push({
            type: "skills_sentence",
            location: `skills.${group.category}`,
            detail: `Removed sentence from skills: "${trimmed.slice(0, 40)}..."`,
            autoFixed: true,
          });
          // Extract just the first few words as the skill name
          const words = trimmed.split(/\s+/).slice(0, 3);
          return words.join(" ");
        }
        return trimmed;
      })
      .filter((item) => item.length > 0),
  }));

  return {
    ...output,
    tailoredResume: {
      ...output.tailoredResume,
      skills,
    },
  };
}

// ── Helpers ──

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
