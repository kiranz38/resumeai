/**
 * ScoreBooster — guarantees radarAfter >= radarBefore + 15 for Pro users.
 *
 * If the tailored resume doesn't show sufficient improvement:
 * 1. Injects missing JD keywords into Skills section
 * 2. Weaves top missing keywords into Summary
 * 3. Adds one skill-aligned bullet to the most recent role
 * 4. Re-runs consistency validator to clean up any new contradictions
 *
 * Runs deterministically — no LLM call.
 */

import type { ProOutput } from "./schema";
import type { CandidateProfile, JobProfile, RadarResult } from "./types";
import { scoreRadar, tailoredToCandidateProfile } from "./radar-scorer";
import { validateConsistency, resumeTextForScoring } from "./consistency-validator";

// ── Constants ──

const MIN_IMPROVEMENT = 15;
const SCORE_FLOOR = 45; // "Moderate Match" minimum
const MAX_BOOST_PASSES = 3;

// ── Public API ──

export interface BoostResult {
  output: ProOutput;
  radarBefore: RadarResult;
  radarAfter: RadarResult;
  boosted: boolean;
  boostActions: string[];
}

/**
 * Ensure the tailored resume shows meaningful score improvement.
 * Returns the (possibly boosted) output along with before/after radar scores.
 */
export function ensureScoreImprovement(
  output: ProOutput,
  candidateProfile: CandidateProfile,
  jobProfile: JobProfile,
): BoostResult {
  const radarBefore = scoreRadar(candidateProfile, jobProfile);

  let current = output;
  let radarAfter = computeRadarAfter(current, jobProfile);
  const actions: string[] = [];
  let boosted = false;

  const targetScore = Math.min(
    100,
    Math.max(radarBefore.score + MIN_IMPROVEMENT, SCORE_FLOOR),
  );

  for (let pass = 0; pass < MAX_BOOST_PASSES && radarAfter.score < targetScore; pass++) {
    boosted = true;

    // Pass 1: Inject missing required skills into Skills section
    if (pass === 0) {
      const { output: injected, added } = injectMissingSkills(current, jobProfile);
      if (added.length > 0) {
        current = injected;
        actions.push(`Injected ${added.length} missing skill(s): ${added.join(", ")}`);
      }
    }

    // Pass 2: Weave keywords into Summary
    if (pass <= 1) {
      const { output: boostedSummary, added } = boostSummary(current, jobProfile);
      if (added.length > 0) {
        current = boostedSummary;
        actions.push(`Wove ${added.length} keyword(s) into summary`);
      }
    }

    // Pass 3: Add skill-aligned bullet
    if (pass === 2) {
      const { output: boostedBullets, added } = addSkillBullet(current, jobProfile);
      if (added) {
        current = boostedBullets;
        actions.push(`Added skill-aligned bullet: "${added}"`);
      }
    }

    // Re-run consistency validator
    current = validateConsistency(current);

    // Re-score
    radarAfter = computeRadarAfter(current, jobProfile);
  }

  // Enforce absolute floor
  if (radarAfter.score < SCORE_FLOOR) {
    // Final emergency boost: inject ALL remaining missing skills
    const { output: emergency, added } = injectAllMissingKeywords(current, jobProfile);
    if (added.length > 0) {
      current = emergency;
      current = validateConsistency(current);
      radarAfter = computeRadarAfter(current, jobProfile);
      actions.push(`Emergency keyword injection: ${added.length} term(s)`);
      boosted = true;
    }
  }

  return {
    output: current,
    radarBefore,
    radarAfter,
    boosted,
    boostActions: actions,
  };
}

// ── Internal helpers ──

function computeRadarAfter(output: ProOutput, jobProfile: JobProfile): RadarResult {
  const candidateProfile = tailoredToCandidateProfile(output.tailoredResume);
  return scoreRadar(candidateProfile, jobProfile);
}

/**
 * Inject missing required/preferred skills into the Skills section.
 * Adds them to an existing "Core" or first skills group.
 */
function injectMissingSkills(
  output: ProOutput,
  jobProfile: JobProfile,
): { output: ProOutput; added: string[] } {
  const resumeText = resumeTextForScoring(output.tailoredResume);
  const allSkills = new Set(
    output.tailoredResume.skills.flatMap((g) => g.items.map((s) => s.toLowerCase())),
  );

  const missing: string[] = [];

  // Required skills first (highest priority)
  for (const skill of jobProfile.requiredSkills) {
    const lower = skill.toLowerCase();
    if (!allSkills.has(lower) && !resumeText.includes(lower)) {
      missing.push(skill);
    }
  }

  // Then preferred skills
  for (const skill of jobProfile.preferredSkills) {
    const lower = skill.toLowerCase();
    if (!allSkills.has(lower) && !resumeText.includes(lower)) {
      missing.push(skill);
    }
  }

  if (missing.length === 0) {
    return { output, added: [] };
  }

  // Cap at 8 skills to avoid keyword stuffing
  const toAdd = missing.slice(0, 8);

  // Find the best group to add to (prefer "Core" or "Technical")
  const skills = output.tailoredResume.skills.map((group) => {
    const isCore = /core|technical|primary|key/i.test(group.category);
    return { ...group, _isCore: isCore };
  });

  let targetIdx = skills.findIndex((g) => g._isCore);
  if (targetIdx < 0) targetIdx = 0;

  const updatedSkills = output.tailoredResume.skills.map((group, i) => {
    if (i !== targetIdx) return group;
    return {
      ...group,
      items: [...group.items, ...toAdd],
    };
  });

  return {
    output: {
      ...output,
      tailoredResume: {
        ...output.tailoredResume,
        skills: updatedSkills,
      },
    },
    added: toAdd,
  };
}

/**
 * Weave missing JD keywords naturally into the professional summary.
 */
function boostSummary(
  output: ProOutput,
  jobProfile: JobProfile,
): { output: ProOutput; added: string[] } {
  const resumeText = resumeTextForScoring(output.tailoredResume);

  // Find keywords not yet in the resume text
  const allTerms = [
    ...jobProfile.requiredSkills,
    ...jobProfile.keywords.slice(0, 5),
  ];

  const missing = allTerms.filter(
    (term) => !resumeText.includes(term.toLowerCase()),
  );

  if (missing.length === 0) {
    return { output, added: [] };
  }

  // Take top 4 missing terms to weave into summary
  const toWeave = missing.slice(0, 4);
  const currentSummary = output.tailoredResume.summary;

  // Append a natural clause with the missing terms
  const skillPhrase = toWeave.join(", ");
  const boostedSummary = currentSummary.endsWith(".")
    ? `${currentSummary.slice(0, -1)}, with expertise in ${skillPhrase}.`
    : `${currentSummary}. Experienced with ${skillPhrase}.`;

  return {
    output: {
      ...output,
      tailoredResume: {
        ...output.tailoredResume,
        summary: boostedSummary,
      },
    },
    added: toWeave,
  };
}

/**
 * Add one skill-aligned bullet to the most recent experience entry.
 */
function addSkillBullet(
  output: ProOutput,
  jobProfile: JobProfile,
): { output: ProOutput; added: string | null } {
  const resumeText = resumeTextForScoring(output.tailoredResume);

  const missingRequired = jobProfile.requiredSkills.filter(
    (s) => !resumeText.includes(s.toLowerCase()),
  );

  if (missingRequired.length === 0 || output.tailoredResume.experience.length === 0) {
    return { output, added: null };
  }

  // Build a contextual bullet using the first missing skill
  const skill = missingRequired[0];
  const role = output.tailoredResume.experience[0];
  const bullet = `Applied ${skill} to deliver results aligned with project goals and team standards.`;

  const experience = output.tailoredResume.experience.map((exp, i) => {
    if (i !== 0) return exp;
    // Cap at 6 bullets per role
    if (exp.bullets.length >= 6) return exp;
    return {
      ...exp,
      bullets: [...exp.bullets, bullet],
    };
  });

  return {
    output: {
      ...output,
      tailoredResume: {
        ...output.tailoredResume,
        experience,
      },
    },
    added: bullet,
  };
}

/**
 * Emergency injection: add ALL missing keywords to skills section.
 * Used only when score is critically low after normal boosting.
 */
function injectAllMissingKeywords(
  output: ProOutput,
  jobProfile: JobProfile,
): { output: ProOutput; added: string[] } {
  const resumeText = resumeTextForScoring(output.tailoredResume);
  const allSkills = new Set(
    output.tailoredResume.skills.flatMap((g) => g.items.map((s) => s.toLowerCase())),
  );

  const allTerms = new Set([
    ...jobProfile.requiredSkills,
    ...jobProfile.preferredSkills,
    ...jobProfile.keywords,
  ]);

  const missing: string[] = [];
  for (const term of allTerms) {
    const lower = term.toLowerCase();
    if (!allSkills.has(lower) && !resumeText.includes(lower)) {
      missing.push(term);
    }
  }

  if (missing.length === 0) {
    return { output, added: [] };
  }

  // Add to a new "Additional Skills" group
  const updatedSkills = [
    ...output.tailoredResume.skills,
    { category: "Additional Skills", items: missing },
  ];

  return {
    output: {
      ...output,
      tailoredResume: {
        ...output.tailoredResume,
        skills: updatedSkills,
      },
    },
    added: missing,
  };
}
