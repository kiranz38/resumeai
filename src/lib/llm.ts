import type { CandidateProfile, JobProfile } from "./types";
import type { ProOutput } from "./schema";
import { ProOutputSchema } from "./schema";
import { generateMockProResult } from "./mock-llm";
import { buildStructuredResumeForLLM, smartTruncate } from "./input-preprocessor";
import { buildSystemPrompt, QA_SYSTEM_PROMPT, PROMPT_VERSION } from "./llm/prompts";
import { classifyJobFamily } from "./domain";

const MAX_RETRIES = 1;
const LLM_TIMEOUT_MS = 170_000; // 170s timeout — large resumes with Sonnet take 60-150s

// Common words excluded from fuzzy bullet deduplication
const COMMON_WORDS = new Set(["the", "and", "for", "with", "from", "that", "this", "have", "been", "were", "using", "based", "work", "team", "teams", "also", "various", "including", "across", "ensure", "ensuring"]);

/**
 * Generate Pro results using Claude API (or mock mode).
 * Throws on failure instead of silently falling back to mock.
 */
export async function generateProResult(
  candidate: CandidateProfile,
  job: JobProfile,
  resumeText: string,
  jobDescriptionText: string
): Promise<ProOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = process.env.MOCK_LLM === "true";

  if (useMock) {
    console.log("[llm] Using mock LLM mode (MOCK_LLM=true)");
    return generateMockProResult(candidate, job, resumeText);
  }

  if (!apiKey) {
    console.error("[llm] ANTHROPIC_API_KEY is not set - falling back to mock");
    return generateMockProResult(candidate, job, resumeText);
  }

  // Real LLM mode
  console.log("[llm] Using Anthropic Claude API");

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callClaude(candidate, job, resumeText, jobDescriptionText, apiKey, attempt > 0);
      console.log("[llm] Generation successful on attempt", attempt + 1);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[llm] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, lastError.message);

      // Don't retry on auth errors or invalid API key
      if (lastError.message.includes("401") || lastError.message.includes("403")) {
        break;
      }
    }
  }

  // Instead of silently returning mock, throw the real error
  throw new Error(lastError?.message || "AI generation failed. Please try again.");
}

/**
 * Sanitize user input before sending to LLM.
 * Strips patterns commonly used in prompt injection attempts.
 */
function sanitizeForLLM(text: string): string {
  return text
    .replace(/\0/g, "")
    .replace(/\b(IGNORE|DISREGARD|FORGET)\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+(INSTRUCTIONS?|PROMPTS?|RULES?)/gi,
      "[FILTERED]")
    .replace(/\b(SYSTEM|ASSISTANT|USER)\s*:/gi, "[FILTERED]:")
    .replace(/```system[\s\S]*?```/gi, "[FILTERED]")
    .replace(/[<>]{3,}/g, "");
}

/** LLM suggestions shape — the LLM extracts factual data AND provides improvements */
interface LLMSuggestions {
  headline: string;
  professionalSummary: string;
  bulletsByRole: Array<{
    company: string;   // LLM-extracted from resume text
    title: string;     // LLM-extracted from resume text
    start: string;     // LLM-extracted from resume text
    end: string;       // LLM-extracted from resume text
    bullets: string[];
  }>;
  education: Array<{   // LLM-extracted from resume text
    school: string;
    degree: string;
    year: string;
  }>;
  skills: Array<{ category: string; items: string[] }>;
  summary: string;
  coverLetter: { paragraphs: string[] };
  keywordChecklist: Array<{ keyword: string; found: boolean; section?: string; suggestion?: string }>;
  recruiterFeedback: string[];
  bulletRewrites: Array<{ original: string; rewritten: string; section: string; notes: string }>;
  experienceGaps: Array<{ gap: string; suggestion: string; severity: "high" | "medium" | "low" }>;
  nextActions: string[];
  radar?: { overall: number; skillsMatch: number; experienceAlignment: number; impactStrength: number; atsReadiness: number };
  beforeAfterPreview?: { before: string; after: string };
  interviewTalkingPoints?: string[];
}

/**
 * Tool definition for structured JSON output via Claude tool_use.
 * The LLM returns ONLY improvements — factual data (companies, titles, dates,
 * education) comes from the heuristic resume parser.
 */
const IMPROVEMENTS_TOOL = {
  name: "submit_resume_improvements",
  description: "Extract ALL experience roles and education from the resume with their factual details, then provide improved bullets and other content.",
  input_schema: {
    type: "object" as const,
    required: [
      "summary",
      "headline",
      "professionalSummary",
      "bulletsByRole",
      "education",
      "skills",
      "coverLetter",
      "keywordChecklist",
      "recruiterFeedback",
      "bulletRewrites",
      "experienceGaps",
      "nextActions",
      "radar",
      "beforeAfterPreview",
      "interviewTalkingPoints",
    ],
    properties: {
      summary: {
        type: "string",
        description: "Executive summary of the analysis (2-3 sentences)",
      },
      headline: {
        type: "string",
        description: "Improved professional headline/title tailored to the job",
      },
      professionalSummary: {
        type: "string",
        description: "Improved professional summary paragraph (3-4 sentences)",
      },
      bulletsByRole: {
        type: "array",
        description: "Extract ALL experience roles from the resume in reverse-chronological order. Copy company, title, start, end VERBATIM from the resume text. Then provide improved bullets for each.",
        items: {
          type: "object",
          required: ["company", "title", "start", "end", "bullets"],
          properties: {
            company: {
              type: "string",
              description: "Company name copied EXACTLY from the resume (preserve original spelling, abbreviations, Ltd/Inc/Pty etc.)",
            },
            title: {
              type: "string",
              description: "Job title copied EXACTLY from the resume",
            },
            start: {
              type: "string",
              description: "Start date as written in the resume (e.g. 'Jan 2020', '2020', 'March 2019'). Empty string if not stated.",
            },
            end: {
              type: "string",
              description: "End date as written in the resume (e.g. 'Dec 2023', 'Present', 'Current'). Empty string if not stated.",
            },
            bullets: {
              type: "array",
              items: { type: "string" },
              description: "Improved bullet points for this role. Include AT LEAST as many bullets as the original — never reduce content. Improve existing bullets and add new ones where relevant.",
            },
          },
        },
      },
      education: {
        type: "array",
        description: "Extract ALL education entries from the resume. Copy school, degree, year VERBATIM.",
        items: {
          type: "object",
          required: ["school", "degree", "year"],
          properties: {
            school: {
              type: "string",
              description: "School/university name copied EXACTLY from the resume",
            },
            degree: {
              type: "string",
              description: "Degree and field copied EXACTLY from the resume (e.g. 'BSc Computer Science', 'MBA')",
            },
            year: {
              type: "string",
              description: "Graduation year or date range as written (e.g. '2018', '2016-2020'). Empty string if not stated.",
            },
          },
        },
      },
      skills: {
        type: "array",
        description: "ALL skills from the resume grouped by category (3-6 groups), plus relevant skills from the job description",
        items: {
          type: "object",
          required: ["category", "items"],
          properties: {
            category: { type: "string" },
            items: { type: "array", items: { type: "string" } },
          },
        },
      },
      coverLetter: {
        type: "object",
        required: ["paragraphs"],
        properties: {
          paragraphs: {
            type: "array",
            items: { type: "string" },
            description: "3-4 paragraphs for the cover letter",
          },
        },
      },
      keywordChecklist: {
        type: "array",
        description: "Top 10-15 keywords from the job description",
        items: {
          type: "object",
          required: ["keyword", "found"],
          properties: {
            keyword: { type: "string" },
            found: { type: "boolean" },
            section: { type: "string" },
            suggestion: { type: "string" },
          },
        },
      },
      recruiterFeedback: {
        type: "array",
        items: { type: "string" },
        description: "4-6 bullet points of recruiter-style feedback",
      },
      bulletRewrites: {
        type: "array",
        description: "Top 5 bullet rewrites",
        items: {
          type: "object",
          required: ["original", "rewritten", "section", "notes"],
          properties: {
            original: { type: "string" },
            rewritten: { type: "string" },
            section: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
      experienceGaps: {
        type: "array",
        description: "2-4 experience gaps with suggestions",
        items: {
          type: "object",
          required: ["gap", "suggestion", "severity"],
          properties: {
            gap: { type: "string" },
            suggestion: { type: "string" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
          },
        },
      },
      nextActions: {
        type: "array",
        items: { type: "string" },
        description: "3-5 actionable next steps",
      },
      radar: {
        type: "object",
        description: "Radar scoring (0-100 each). overall = skillsMatch*0.3 + experienceAlignment*0.3 + impactStrength*0.25 + atsReadiness*0.15",
        required: ["overall", "skillsMatch", "experienceAlignment", "impactStrength", "atsReadiness"],
        properties: {
          overall: { type: "number", description: "Weighted average score (0-100)" },
          skillsMatch: { type: "number", description: "Required skills 2x weight, preferred 1x (0-100)" },
          experienceAlignment: { type: "number", description: "Title similarity, domain relevance, seniority signals (0-100)" },
          impactStrength: { type: "number", description: "Metrics presence, ownership verbs, scope indicators (0-100)" },
          atsReadiness: { type: "number", description: "Keyword coverage, formatting, section completeness (0-100)" },
        },
      },
      beforeAfterPreview: {
        type: "object",
        description: "Select one weak original bullet and show its improved version for conversion preview",
        required: ["before", "after"],
        properties: {
          before: { type: "string", description: "One weak original bullet from the resume" },
          after: { type: "string", description: "Improved version with stronger verb, JD alignment, metric or scale" },
        },
      },
      interviewTalkingPoints: {
        type: "array",
        items: { type: "string" },
        description: "3-5 interview talking points: architecture decisions, performance stories, leadership scenarios, system design tradeoffs",
      },
    },
  },
};

/**
 * QA gate tool — Haiku verifies factual accuracy of the merged output.
 */
const QA_TOOL = {
  name: "submit_qa_corrections",
  description: "Submit factual corrections for the resume. Return an empty corrections array if everything looks correct.",
  input_schema: {
    type: "object" as const,
    required: ["corrections"],
    properties: {
      corrections: {
        type: "array",
        description: "List of corrections. Empty array means everything is accurate.",
        items: {
          type: "object",
          required: ["field", "correctedValue"],
          properties: {
            field: {
              type: "string",
              description: "Dot-path to the field, e.g. 'experience.0.company' or 'experience.1.period'",
            },
            correctedValue: {
              type: "string",
              description: "The corrected value from the original resume",
            },
          },
        },
      },
    },
  },
};

/**
 * Safely merge bullets: never reduce content below original count.
 * If LLM returned fewer bullets than the original, append non-duplicate originals.
 */
function safeMergeBullets(llmBullets: string[], originalBullets: string[]): string[] {
  if (llmBullets.length === 0) return originalBullets;
  if (llmBullets.length >= originalBullets.length) return llmBullets;

  // LLM returned fewer — check ALL original bullets (not just tail) for ones the LLM dropped
  const remaining = originalBullets.filter(orig => {
    // Skip fragment bullets
    if (orig.length < 20 || /\s+(and|or|the|a|an|to|of|in|for|with|by|at|from|as|on|into|via)\s*$/i.test(orig)) return false;
    // Skip if an improved bullet already covers this content (3+ shared significant words)
    const origWords = new Set((orig.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(w => !COMMON_WORDS.has(w)));
    if (origWords.size === 0) return false; // Can't match, likely too short
    return !llmBullets.some(imp => {
      const impWords = (imp.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(w => !COMMON_WORDS.has(w));
      const overlap = impWords.filter(w => origWords.has(w)).length;
      // For short bullets (few significant words), require proportionally fewer matches
      const threshold = origWords.size <= 3 ? 2 : 3;
      return overlap >= threshold;
    });
  });
  return [...llmBullets, ...remaining];
}

/**
 * Normalize a string for fuzzy company/school matching.
 */
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Fuzzy match two company/school names.
 * Handles compound names like "Westpac (With TCS(Technical Lead))" matching "TCS" or "Westpac".
 */
function fuzzyNameMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Substring: one contains the other (min length 3 to avoid false positives)
  if (na.length >= 3 && nb.length >= 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }
  return false;
}

/**
 * Merge LLM-extracted data with heuristic parser data.
 *
 * Two paths:
 * - PRIMARY: LLM extracted roles → use LLM company/title/dates/bullets.
 *   Cross-check against parser: if parser found roles the LLM missed, append them.
 * - FALLBACK: LLM roles empty → revert to old index-matching logic
 *   (parser structure + LLM bullets).
 *
 * Same pattern for education.
 */
function mergeWithParsed(
  candidate: CandidateProfile,
  llm: LLMSuggestions,
): ProOutput {
  const llmHasRoles = llm.bulletsByRole.length > 0 &&
    llm.bulletsByRole.some(r => r.company || r.title);
  const llmHasEducation = llm.education.length > 0 &&
    llm.education.some(e => e.school || e.degree);

  const originalBulletCount = candidate.experience.reduce((sum, e) => sum + e.bullets.length, 0);

  // ── Experience ──
  let experience: Array<{ company: string; title: string; period: string; bullets: string[] }>;

  if (llmHasRoles) {
    // PRIMARY: LLM-extracted roles
    // Track which parser entries were matched so we can append unmatched ones
    const matchedParserIndices = new Set<number>();

    experience = llm.bulletsByRole.map(role => {
      // Find matching parser entry by company+title (fuzzy), then fallback to company-only (fuzzy)
      let parserIdx = candidate.experience.findIndex(
        (pe, i) => !matchedParserIndices.has(i)
          && fuzzyNameMatch(pe.company || "", role.company)
          && fuzzyNameMatch(pe.title || "", role.title)
      );
      if (parserIdx === -1) {
        parserIdx = candidate.experience.findIndex(
          (pe, i) => !matchedParserIndices.has(i)
            && fuzzyNameMatch(pe.company || "", role.company)
        );
      }
      // Also try matching by title only (for cases where parser has compound company names)
      if (parserIdx === -1) {
        parserIdx = candidate.experience.findIndex(
          (pe, i) => !matchedParserIndices.has(i)
            && fuzzyNameMatch(pe.title || "", role.title)
            && normalizeName(pe.title || "").length >= 5
        );
      }
      const parserMatch = parserIdx >= 0 ? candidate.experience[parserIdx] : undefined;
      if (parserIdx >= 0) matchedParserIndices.add(parserIdx);

      const originalBullets = parserMatch?.bullets || [];
      return {
        company: role.company || parserMatch?.company || "",
        title: role.title || parserMatch?.title || "",
        period: [role.start, role.end].filter(Boolean).join(" – "),
        bullets: safeMergeBullets(role.bullets, originalBullets),
      };
    });

    // Cross-check: append parser roles the LLM missed (handles same-company promotions)
    for (let i = 0; i < candidate.experience.length; i++) {
      if (matchedParserIndices.has(i)) continue;
      const pe = candidate.experience[i];
      if (!pe.company && !pe.title && pe.bullets.length === 0) continue;
      console.warn(`[llm:merge] Parser role #${i} "${pe.title || "?"} at ${pe.company || "?"}" not in LLM output — appending with original bullets`);
      experience.push({
        company: pe.company || "",
        title: pe.title || "",
        period: [pe.start, pe.end].filter(Boolean).join(" – "),
        bullets: pe.bullets,
      });
    }
  } else {
    // FALLBACK: old index-matching logic (parser structure + LLM bullets)
    console.warn("[llm:merge] LLM returned no extracted roles — falling back to parser structure");
    experience = candidate.experience.map((exp, i) => {
      const llmBullets = llm.bulletsByRole[i]?.bullets || [];
      return {
        company: exp.company || "",
        title: exp.title || "",
        period: [exp.start, exp.end].filter(Boolean).join(" – "),
        bullets: safeMergeBullets(llmBullets, exp.bullets),
      };
    });
  }

  // ── Education ──
  let education: Array<{ school: string; degree: string; year?: string }>;

  if (llmHasEducation) {
    // PRIMARY: LLM-extracted education
    const matchedEduIndices = new Set<number>();

    education = llm.education.map(e => {
      const eduIdx = candidate.education.findIndex(
        (pe, i) => !matchedEduIndices.has(i)
          && fuzzyNameMatch(pe.school || "", e.school)
      );
      if (eduIdx >= 0) matchedEduIndices.add(eduIdx);
      return {
        school: e.school,
        degree: e.degree,
        year: e.year || undefined,
      };
    });

    // Cross-check: append parser education entries the LLM missed
    for (let i = 0; i < candidate.education.length; i++) {
      if (matchedEduIndices.has(i)) continue;
      const pe = candidate.education[i];
      if (!pe.school && !pe.degree) continue;
      console.warn(`[llm:merge] Parser education #${i} "${pe.school}" not in LLM output — appending`);
      education.push({
        school: pe.school || "",
        degree: pe.degree || "",
        year: pe.end || pe.start || undefined,
      });
    }
  } else {
    // FALLBACK: parser education
    education = candidate.education.map(edu => ({
      school: edu.school || "",
      degree: edu.degree || "",
      year: edu.end || edu.start,
    }));
  }

  const filteredExperience = experience.filter(exp => exp.company || exp.title || exp.bullets.length > 0);

  // Content preservation check — the output must never have fewer bullets than the original
  const mergedBulletCount = filteredExperience.reduce((sum, e) => sum + e.bullets.length, 0);
  if (mergedBulletCount < originalBulletCount) {
    console.warn(
      `[llm:merge] CONTENT LOSS DETECTED: original had ${originalBulletCount} bullets, merged has ${mergedBulletCount}. ` +
      `Parser had ${candidate.experience.length} roles, merged has ${filteredExperience.length} roles.`
    );
  }

  return {
    summary: llm.summary,
    tailoredResume: {
      name: candidate.name || "Your Name",
      headline: llm.headline,
      summary: llm.professionalSummary,
      skills: llm.skills,
      experience: filteredExperience,
      education,
      // Pass through parsed data the LLM doesn't generate
      projects: candidate.projects.length > 0
        ? candidate.projects.map((p) => ({
            name: p.name || "Project",
            bullets: p.bullets,
          }))
        : undefined,
      email: candidate.email || undefined,
      phone: candidate.phone || undefined,
      location: candidate.location || undefined,
      links: candidate.links || undefined,
    },
    coverLetter: llm.coverLetter,
    keywordChecklist: llm.keywordChecklist,
    recruiterFeedback: llm.recruiterFeedback,
    bulletRewrites: llm.bulletRewrites,
    experienceGaps: llm.experienceGaps,
    nextActions: llm.nextActions,
    radar: llm.radar,
    beforeAfterPreview: llm.beforeAfterPreview,
    interviewTalkingPoints: llm.interviewTalkingPoints,
  };
}

/**
 * Apply QA corrections to the merged ProOutput.
 * Corrections use dot-paths like "experience.0.company".
 */
function applyCorrections(
  output: ProOutput,
  corrections: Array<{ field: string; correctedValue: string }>,
): ProOutput {
  const result: ProOutput = JSON.parse(JSON.stringify(output));

  for (const { field, correctedValue } of corrections) {
    const expMatch = field.match(/^experience\.(\d+)\.(\w+)$/);
    if (expMatch) {
      const idx = parseInt(expMatch[1]);
      const prop = expMatch[2];
      const entry = result.tailoredResume.experience[idx];
      if (entry && prop in entry && prop !== "bullets") {
        (entry as Record<string, unknown>)[prop] = correctedValue;
      }
      continue;
    }

    const eduMatch = field.match(/^education\.(\d+)\.(\w+)$/);
    if (eduMatch) {
      const idx = parseInt(eduMatch[1]);
      const prop = eduMatch[2];
      const entry = result.tailoredResume.education[idx];
      if (entry && prop in entry) {
        (entry as Record<string, unknown>)[prop] = correctedValue;
      }
    }
  }

  return result;
}

/**
 * QA gate: fast Haiku call to verify factual accuracy of merged output.
 */
async function qaGate(
  merged: ProOutput,
  resumeText: string,
  apiKey: string,
): Promise<ProOutput> {
  const resumeSnippet = smartTruncate(resumeText, 8000);

  const experienceSummary = merged.tailoredResume.experience
    .map((e, i) => `  ${i}. company="${e.company}" title="${e.title}" period="${e.period}"`)
    .join("\n");
  const educationSummary = merged.tailoredResume.education
    .map((e, i) => `  ${i}. school="${e.school}" degree="${e.degree}" year="${e.year || ""}"`)
    .join("\n");

  const prompt = `Cross-verify ALL extracted resume fields against the original resume text. Check for:
1. Every company name, job title, and date must match the original text EXACTLY (spelling, abbreviations, Ltd/Inc/Pty Ltd)
2. No roles from the resume should be missing
3. No hallucinated roles that don't exist in the resume
4. Every school name, degree, and year must match the original text EXACTLY
5. No education entries should be missing or invented

Return corrections ONLY for real factual errors. If everything looks correct, return an empty corrections array.

MERGED RESUME FIELDS:
Name: ${merged.tailoredResume.name}
Experience:
${experienceSummary}
Education:
${educationSummary}

ORIGINAL RESUME TEXT:
${resumeSnippet}

Use the submit_qa_corrections tool with your result.`;

  try {
    console.log("[llm:qa] Running QA gate (model: claude-haiku-4-5-20251001)");
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        tools: [QA_TOOL],
        tool_choice: { type: "tool", name: "submit_qa_corrections" },
        messages: [{ role: "user", content: prompt }],
        system: QA_SYSTEM_PROMPT,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      console.warn(`[llm:qa] QA gate API error ${response.status} after ${elapsed}s — skipping QA`);
      return merged;
    }

    const data = await response.json();
    const toolBlock = data.content?.find((b: { type: string }) => b.type === "tool_use");

    if (!toolBlock) {
      console.warn("[llm:qa] No tool_use block from QA — skipping");
      return merged;
    }

    const corrections: Array<{ field: string; correctedValue: string }> =
      Array.isArray(toolBlock.input?.corrections) ? toolBlock.input.corrections : [];

    if (corrections.length === 0) {
      console.log(`[llm:qa] QA gate passed in ${elapsed}s — no corrections needed`);
      return merged;
    }

    console.log(`[llm:qa] QA gate found ${corrections.length} correction(s) in ${elapsed}s:`,
      corrections.map(c => `${c.field} → "${c.correctedValue}"`));
    return applyCorrections(merged, corrections);
  } catch (error) {
    // QA gate is non-critical — if it fails, return merged as-is
    console.warn("[llm:qa] QA gate failed, skipping:", error instanceof Error ? error.message : error);
    return merged;
  }
}

async function callClaude(
  candidate: CandidateProfile,
  job: JobProfile,
  resumeText: string,
  jobDescriptionText: string,
  apiKey: string,
  isRetry: boolean
): Promise<ProOutput> {
  const { family } = classifyJobFamily(candidate, job);
  const systemPrompt = buildSystemPrompt(isRetry, family);

  // Preprocess and sanitize user inputs before sending to LLM
  // Use generous budget (24K chars ≈ 6K tokens) to avoid truncating long resumes
  const structuredResume = buildStructuredResumeForLLM(resumeText, 24000);
  const safeResume = sanitizeForLLM(structuredResume);
  const safeJD = sanitizeForLLM(smartTruncate(jobDescriptionText, 4000));

  // Build heuristic hints for the LLM (fallback context, not authoritative)
  const heuristicHints = candidate.experience.length > 0
    ? candidate.experience.map((e, i) => {
        const period = e.start ? `${e.start}${e.end ? ` – ${e.end}` : ""}` : "";
        return `  ${i + 1}. ${e.title || "?"} at ${e.company || "?"}${period ? ` (${period})` : ""} [${e.bullets.length} bullets]`;
      }).join("\n")
    : "  (none detected)";

  const heuristicEdu = candidate.education.length > 0
    ? candidate.education.map((e, i) => {
        const period = e.end || e.start || "";
        return `  ${i + 1}. ${e.degree || "?"} at ${e.school || "?"}${period ? ` (${period})` : ""}`;
      }).join("\n")
    : "  (none detected)";

  const userPrompt = `Analyze this resume against the job description. Extract ALL experience roles and education from the resume text, then provide improvements. Use the submit_resume_improvements tool.

RESUME TEXT:
${safeResume}

JOB DESCRIPTION:
${safeJD}

HEURISTIC PARSER HINTS (may be incomplete or incorrect — use the resume text above as ground truth):
Experience detected:
${heuristicHints}
Education detected:
${heuristicEdu}

CANDIDATE INFO:
Name: ${candidate.name || "Unknown"}
Current Skills: ${candidate.skills.join(", ")}

TARGET JOB:
Title: ${job.title || "Unknown"}
Company: ${job.company || "Unknown"}
Required: ${job.requiredSkills.join("; ")}
Keywords: ${job.keywords.join(", ")}

INSTRUCTIONS:
1. Read the RESUME TEXT carefully and extract EVERY experience role (company, title, start date, end date) and EVERY education entry (school, degree, year) EXACTLY as written.
2. For each role, provide improved bullets (at least as many as the original).
3. Provide all other fields (headline, summary, skills, cover letter, etc.).
4. Call the submit_resume_improvements tool with your result.`;

  // Use AbortController for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    console.log("[llm] Calling Claude API with tool_use (model: claude-sonnet-4-5-20250929, max_tokens: 16384)");
    const startTime = Date.now();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 16384,
        tools: [IMPROVEMENTS_TOOL],
        tool_choice: { type: "tool", name: "submit_resume_improvements" },
        messages: [
          { role: "user", content: userPrompt },
        ],
        system: systemPrompt,
      }),
      signal: controller.signal,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`[llm] Claude API error ${response.status} after ${elapsed}s:`, errorBody.slice(0, 300));
      throw new Error(`Claude API error ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();

    // With tool_use, the response contains a tool_use content block with pre-parsed JSON
    const toolUseBlock = data.content?.find(
      (block: { type: string }) => block.type === "tool_use"
    );

    if (!toolUseBlock) {
      const textBlock = data.content?.find(
        (block: { type: string }) => block.type === "text"
      );
      console.error("[llm] No tool_use block found. Text content:", textBlock?.text?.slice(0, 300));
      throw new Error("AI did not return structured data. Please try again.");
    }

    const parsed = toolUseBlock.input;
    console.log(`[llm] Claude API responded in ${elapsed}s via tool_use, stop_reason: ${data.stop_reason}`);

    const wasTruncated = data.stop_reason === "max_tokens";
    if (wasTruncated) {
      console.warn("[llm] Response was truncated (max_tokens reached) — tool input may be incomplete, parser cross-check will fill gaps");
    }

    // Coerce LLM output into LLMSuggestions shape
    const suggestions: LLMSuggestions = {
      headline: String(parsed.headline || job.title || "Professional"),
      professionalSummary: String(parsed.professionalSummary || ""),
      bulletsByRole: Array.isArray(parsed.bulletsByRole)
        ? parsed.bulletsByRole.map((r: Record<string, unknown>) => ({
            company: String(r.company || ""),
            title: String(r.title || ""),
            start: String(r.start || ""),
            end: String(r.end || ""),
            bullets: Array.isArray(r.bullets) ? r.bullets.map(String) : [],
          }))
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.map((e: Record<string, unknown>) => ({
            school: String(e.school || ""),
            degree: String(e.degree || ""),
            year: String(e.year || ""),
          }))
        : [],
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map((s: Record<string, unknown>) => ({
            category: String(s.category || "Skills"),
            items: Array.isArray(s.items) ? s.items.map(String) : [],
          }))
        : [],
      summary: String(parsed.summary || "Resume analysis complete. See sections below for details."),
      coverLetter: {
        paragraphs: Array.isArray(parsed.coverLetter?.paragraphs)
          ? parsed.coverLetter.paragraphs.map(String)
          : typeof parsed.coverLetter === "string"
            ? parsed.coverLetter.split("\n\n").filter(Boolean)
            : [],
      },
      keywordChecklist: Array.isArray(parsed.keywordChecklist)
        ? parsed.keywordChecklist.map((k: Record<string, unknown>) => ({
            keyword: String(k.keyword || ""),
            found: Boolean(k.found),
            section: k.section ? String(k.section) : undefined,
            suggestion: k.suggestion ? String(k.suggestion) : undefined,
          }))
        : [],
      recruiterFeedback: Array.isArray(parsed.recruiterFeedback)
        ? parsed.recruiterFeedback.map(String)
        : typeof parsed.recruiterFeedback === "string"
          ? parsed.recruiterFeedback.split("\n").filter(Boolean)
          : [],
      bulletRewrites: Array.isArray(parsed.bulletRewrites)
        ? parsed.bulletRewrites.map((b: Record<string, unknown>) => ({
            original: String(b.original || ""),
            rewritten: String(b.rewritten || ""),
            section: String(b.section || "Experience"),
            notes: String(b.notes || ""),
          }))
        : [],
      experienceGaps: Array.isArray(parsed.experienceGaps)
        ? parsed.experienceGaps.map((g: Record<string, unknown>) => ({
            gap: String(g.gap || ""),
            suggestion: String(g.suggestion || ""),
            severity: (["high", "medium", "low"].includes(String(g.severity)) ? String(g.severity) : "medium") as "high" | "medium" | "low",
          }))
        : [],
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.map(String) : [],
    };

    // Merge parsed factual data with LLM improvements
    const merged = mergeWithParsed(candidate, suggestions);

    // Validate merged output with Zod
    const validated = ProOutputSchema.safeParse(merged);
    if (!validated.success) {
      console.warn("[llm] Merged output Zod validation failed:", validated.error.issues.slice(0, 5).map(i => `${i.path.join('.')}: ${i.message}`));
    } else {
      console.log("[llm] Merged output Zod validation passed");
    }

    // QA gate: verify factual accuracy with Haiku
    const finalOutput = await qaGate(merged, resumeText, apiKey);
    return finalOutput;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI generation timed out. Please try again — this sometimes happens during high traffic.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
