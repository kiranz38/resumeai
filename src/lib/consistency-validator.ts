/**
 * ConsistencyValidator — post-generation deterministic fixer.
 *
 * Eliminates contradictions between the tailored resume and the
 * LLM-generated insights (keyword checklist, experience gaps,
 * recruiter feedback). Also enforces tone control — no discouraging
 * language in recruiter feedback or insights.
 *
 * Runs after Pro generation, no extra LLM call.
 */

import type { ProOutput } from "./schema";

// ── Forbidden language patterns (never show to Pro users) ──

const FORBIDDEN_PHRASES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bweak match\b/gi, replacement: "opportunity for improvement" },
  { pattern: /\blacks?\s+experience\b/gi, replacement: "could further emphasize experience" },
  { pattern: /\bmissing leadership\b/gi, replacement: "opportunity to highlight leadership" },
  { pattern: /\bunderqualified\b/gi, replacement: "could strengthen alignment" },
  { pattern: /\bpoor(?:ly)?\s+match/gi, replacement: "moderate alignment" },
  { pattern: /\bno\s+relevant\s+experience\b/gi, replacement: "limited direct experience shown" },
  { pattern: /\bnot\s+qualified\b/gi, replacement: "could strengthen qualifications" },
  { pattern: /\binsufficient\b/gi, replacement: "limited" },
  { pattern: /\binadequate\b/gi, replacement: "developing" },
  { pattern: /\bfails?\s+to\b/gi, replacement: "could" },
  { pattern: /\bdoes\s+not\s+meet\b/gi, replacement: "partially meets" },
  { pattern: /\bweak\b/gi, replacement: "developing" },
];

// Patterns that indicate a line claims something is missing when it may be present
const CONTRADICTION_PATTERNS = [
  /no\s+(\w[\w\s./+-]*?)\s+(shown|demonstrated|found|present|listed|included)/i,
  /missing\s+(\w[\w\s./+-]*?)\s+(from|in|on)/i,
  /lacks?\s+(\w[\w\s./+-]*?)(\s|$|,|\.)/i,
  /without\s+(\w[\w\s./+-]*?)(\s|$|,|\.)/i,
  /does not (include|mention|show|demonstrate)\s+(\w[\w\s./+-]*?)(\s|$|,|\.)/i,
  /absence\s+of\s+(\w[\w\s./+-]*?)(\s|$|,|\.)/i,
  /no\s+evidence\s+of\s+(\w[\w\s./+-]*?)(\s|$|,|\.)/i,
];

/**
 * Convert a tailored resume into a single lowercase text blob
 * used for keyword detection and scoring consistency.
 */
export function resumeTextForScoring(tailored: ProOutput["tailoredResume"]): string {
  const parts: string[] = [
    tailored.name,
    tailored.headline,
    tailored.summary,
    ...tailored.skills.flatMap((g) => [g.category, ...g.items]),
    ...tailored.experience.flatMap((e) => [
      e.company,
      e.title,
      ...e.bullets,
    ]),
    ...tailored.education.map((e) => `${e.degree} ${e.school}`),
    ...(tailored.projects || []).flatMap((p) => [p.name, ...p.bullets]),
    ...(tailored.certifications || []),
  ];
  return parts.join(" ").toLowerCase();
}

/**
 * Check if a keyword (or close variant) exists in the resume text.
 * Handles common variations: "TypeScript" vs "Typescript", "CI/CD" vs "CICD", etc.
 */
function keywordFoundInText(keyword: string, text: string): boolean {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return false;

  // Direct substring match
  if (text.includes(kw)) return true;

  // Normalized match (strip slashes, dots, hyphens)
  const normalize = (s: string) => s.replace(/[\/.\-\s]/g, "").toLowerCase();
  if (text.includes(normalize(kw)) || normalize(text).includes(normalize(kw))) return true;

  // Word boundary match for short terms (e.g., "MUI" shouldn't match "communica...")
  if (kw.length <= 4) {
    const wordPattern = new RegExp(`\\b${escapeRegExp(kw)}\\b`, "i");
    return wordPattern.test(text);
  }

  return false;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fix contradictions between the tailored resume and LLM insights.
 * Also enforces tone control — replaces discouraging language with
 * supportive alternatives.
 *
 * Returns a new ProOutput with inconsistencies resolved.
 */
export function validateConsistency(output: ProOutput): ProOutput {
  const resumeText = resumeTextForScoring(output.tailoredResume);
  const allSkills = output.tailoredResume.skills
    .flatMap((g) => g.items)
    .map((s) => s.toLowerCase());

  // ── Fix keyword checklist ──
  // If the tailored resume contains a keyword the LLM marked as "not found",
  // flip it to found.
  const keywordChecklist = output.keywordChecklist.map((item) => {
    if (!item.found && keywordFoundInText(item.keyword, resumeText)) {
      return {
        ...item,
        found: true,
        section: "Skills / Experience (tailored)",
        suggestion: undefined,
      };
    }
    return item;
  });

  // ── Fix experience gaps ──
  // Remove gaps that claim a skill is missing when the tailored resume includes it.
  const experienceGaps = output.experienceGaps.filter((gap) => {
    const gapText = gap.gap.toLowerCase();

    // Extract quoted terms from gap descriptions like: 'Requirement not demonstrated: "Kubernetes"'
    const quotedTerms = gapText.match(/"([^"]+)"/g)?.map((m) => m.replace(/"/g, "")) || [];

    // Check if any quoted term is now present in the resume
    for (const term of quotedTerms) {
      if (keywordFoundInText(term, resumeText)) return false;
    }

    // Check if the gap mentions a skill that's in the skills list
    for (const skill of allSkills) {
      if (skill.length >= 3 && gapText.includes(skill)) return false;
    }

    return true;
  });

  // ── Fix recruiter feedback ──
  // 1. Remove feedback lines that claim something is missing when it's present.
  // 2. Fix tone of remaining feedback lines.
  let recruiterFeedback = output.recruiterFeedback.filter((line) => {
    for (const pattern of CONTRADICTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Extract the claimed-missing term (group 1 or group 2 depending on pattern)
        const term = (match[1] || match[2] || "").trim();
        if (term && keywordFoundInText(term, resumeText)) {
          return false; // Remove this contradictory feedback line
        }
      }
    }
    return true;
  });

  // Apply tone control to remaining feedback
  recruiterFeedback = recruiterFeedback.map((line) => fixTone(line));

  // ── Fix experience gap tone ──
  const tonedGaps = experienceGaps.map((gap) => ({
    ...gap,
    gap: fixTone(gap.gap),
    suggestion: fixTone(gap.suggestion),
  }));

  // ── Fix next actions ──
  // Remove "add X" suggestions when X is already in the tailored resume.
  // Apply tone control to remaining actions.
  const nextActions = output.nextActions
    .filter((action) => {
      const lower = action.toLowerCase();
      // Pattern: "Add missing technical skills: React, TypeScript"
      const addMissingMatch = lower.match(/add\s+(?:missing\s+)?(?:technical\s+)?skills?:?\s*(.+)/);
      if (addMissingMatch) {
        const skills = addMissingMatch[1].split(/[,;]/).map((s) => s.trim());
        const stillMissing = skills.filter((s) => !keywordFoundInText(s, resumeText));
        return stillMissing.length > 0;
      }
      return true;
    })
    .map((action) => fixTone(action));

  // ── Fix summary text tone ──
  const summary = fixTone(output.summary);

  return {
    ...output,
    summary,
    keywordChecklist,
    experienceGaps: tonedGaps,
    recruiterFeedback,
    nextActions,
  };
}

/**
 * Replace forbidden/discouraging language with supportive alternatives.
 */
function fixTone(text: string): string {
  let result = text;
  for (const { pattern, replacement } of FORBIDDEN_PHRASES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
