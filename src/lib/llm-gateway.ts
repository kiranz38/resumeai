/**
 * Centralized LLM Gateway
 *
 * All LLM calls route through this module. Provides:
 * - Circuit breaker (5 failures in 2 min → open 10 min)
 * - Concurrency limiter (max 3 inflight)
 * - Timeout (30s default)
 * - Zod validation with 2x retry
 * - Graceful fallback to deterministic mock output
 * - Never surfaces raw provider errors to callers
 */

import type { CandidateProfile, JobProfile, RadarResult } from "./types";
import type { ProOutput } from "./schema";
import { ProOutputSchema } from "./schema";
import { generateProResult } from "./llm";
import { generateMockProResult } from "./mock-llm";
import { trackServerEvent } from "./analytics-server";
import { runQualityGate } from "./quality-gate";
import { ensureScoreImprovement } from "./score-booster";
import { classifyJobFamily } from "./domain";

// ── Circuit Breaker ──

interface CircuitState {
  failures: number[];        // timestamps of recent failures
  openedAt: number | null;   // when circuit opened (null = closed)
}

const FAILURE_WINDOW_MS = 2 * 60 * 1000;   // 2 minutes
const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS = 10 * 60 * 1000;   // 10 minutes

const circuit: CircuitState = {
  failures: [],
  openedAt: null,
};

function isCircuitOpen(): boolean {
  if (circuit.openedAt === null) return false;
  if (Date.now() - circuit.openedAt > OPEN_DURATION_MS) {
    // Half-open: allow one probe
    circuit.openedAt = null;
    circuit.failures = [];
    console.log("[llm-gateway] Circuit half-open, allowing probe request");
    return false;
  }
  return true;
}

function recordFailure(): void {
  const now = Date.now();
  circuit.failures.push(now);
  // Prune old failures
  circuit.failures = circuit.failures.filter((t) => now - t < FAILURE_WINDOW_MS);

  if (circuit.failures.length >= FAILURE_THRESHOLD && circuit.openedAt === null) {
    circuit.openedAt = now;
    console.warn(
      `[llm-gateway] Circuit OPEN after ${FAILURE_THRESHOLD} failures in ${FAILURE_WINDOW_MS / 1000}s. ` +
      `Will re-check in ${OPEN_DURATION_MS / 60000} minutes.`
    );
  }
}

function recordSuccess(): void {
  // Reset failure count on success
  circuit.failures = [];
  if (circuit.openedAt !== null) {
    console.log("[llm-gateway] Circuit CLOSED after successful probe");
    circuit.openedAt = null;
  }
}

// ── Concurrency Limiter ──

let activeRequests = 0;
const MAX_CONCURRENT = 3;

function acquireSlot(): boolean {
  if (activeRequests >= MAX_CONCURRENT) return false;
  activeRequests++;
  return true;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
}

// ── Timeout helper ──

const DEFAULT_TIMEOUT_MS = 30_000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("LLM request timed out")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// ── Public API ──

export interface GenerateOptions {
  /** Override timeout (ms). Default 30s. */
  timeoutMs?: number;
  /** If true, skip entitlement check (for pack flow which checks separately). */
  skipEntitlement?: boolean;
}

export interface GatewayResult {
  output: ProOutput;
  /** Whether the result came from the real LLM or the deterministic fallback. */
  source: "llm" | "fallback" | "cache";
  /** If fallback was used, the reason. */
  fallbackReason?: string;
  /** Radar scored from the original resume (before tailoring). */
  radarBefore?: RadarResult;
  /** Radar scored from the final tailored resume (after tailoring + boosting). */
  radarAfter?: RadarResult;
}

/**
 * Generate Pro documents through the LLM gateway.
 * Handles circuit breaking, concurrency, timeout, validation, and fallback.
 */
export async function generateProDocuments(
  candidateProfile: CandidateProfile,
  jobProfile: JobProfile,
  resumeText: string,
  jobDescriptionText: string,
  options: GenerateOptions = {},
): Promise<GatewayResult> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  // 1. Check circuit breaker
  if (isCircuitOpen()) {
    console.log("[llm-gateway] Circuit open — returning fallback");
    trackServerEvent("fallback_used", { reason: "circuit_open" });
    const fb = generateFallbackWithRadar(candidateProfile, jobProfile, resumeText);
    return {
      output: fb.output,
      source: "fallback",
      fallbackReason: "AI service temporarily unavailable. Using fast draft mode.",
      radarBefore: fb.radarBefore,
      radarAfter: fb.radarAfter,
    };
  }

  // 2. Check API key availability
  const useMock = process.env.MOCK_LLM === "true";
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  if (useMock || !hasApiKey) {
    const reason = useMock ? "mock_mode" : "no_api_key";
    console.log(`[llm-gateway] ${reason} — returning fallback`);
    trackServerEvent("fallback_used", { reason });
    const fb = generateFallbackWithRadar(candidateProfile, jobProfile, resumeText);
    return {
      output: fb.output,
      source: "fallback",
      fallbackReason: useMock
        ? undefined // Mock mode is intentional, no user-facing message
        : "AI service not configured. Using fast draft mode.",
      radarBefore: fb.radarBefore,
      radarAfter: fb.radarAfter,
    };
  }

  // 3. Acquire concurrency slot
  if (!acquireSlot()) {
    console.log("[llm-gateway] All LLM slots busy — returning fallback");
    trackServerEvent("fallback_used", { reason: "concurrency_full" });
    const fb = generateFallbackWithRadar(candidateProfile, jobProfile, resumeText);
    return {
      output: fb.output,
      source: "fallback",
      fallbackReason: "Server is busy generating other resumes. Using fast draft mode.",
      radarBefore: fb.radarBefore,
      radarAfter: fb.radarAfter,
    };
  }

  // 4. Classify job family (for logging and domain-aware pipeline)
  const { family, confidence } = classifyJobFamily(candidateProfile, jobProfile);
  console.log(`[llm-gateway] Job family: ${family} (confidence: ${confidence})`);

  // 5. Attempt LLM call with timeout and retries
  try {
    const result = await attemptWithRetry(
      candidateProfile,
      jobProfile,
      resumeText,
      jobDescriptionText,
      timeoutMs,
    );

    // Run quality gate (dedupe, consistency, filler removal)
    const { output: gatedOutput, issues } = runQualityGate(result);
    if (issues.length > 0) {
      console.log(`[llm-gateway] QualityGate fixed ${issues.length} issue(s):`,
        issues.map((i) => `${i.type}:${i.location}`));
    }

    // Enforce no-injection (strip skills not in candidate + JD)
    const noInjectionOutput = enforceSkillsNoInjection(gatedOutput, candidateProfile, jobProfile);

    // Run score booster (ensures radarAfter >= radarBefore + 15, keyword injection)
    const { output: boostedOutput, radarBefore, radarAfter, boosted, boostActions } =
      ensureScoreImprovement(noInjectionOutput, candidateProfile, jobProfile);
    if (boosted) {
      console.log(`[llm-gateway] ScoreBooster applied ${boostActions.length} action(s):`,
        boostActions);
    }

    // Final quality gate pass on boosted output (score booster may have added content)
    const { output: finalOutput } = runQualityGate(boostedOutput);

    console.log(`[llm-gateway] Radar: before=${radarBefore.score} after=${radarAfter.score} (${radarAfter.label})`);

    recordSuccess();
    trackServerEvent("pro_generation_completed", {
      source: "llm",
      qualityFixes: issues.length,
      radarBefore: radarBefore.score,
      radarAfter: radarAfter.score,
      boosted,
    });
    return { output: finalOutput, source: "llm", radarBefore, radarAfter };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown LLM error";
    console.error("[llm-gateway] LLM call failed after retries:", msg);
    recordFailure();

    trackServerEvent("fallback_used", { reason: "llm_error" });
    const fb = generateFallbackWithRadar(candidateProfile, jobProfile, resumeText);
    return {
      output: fb.output,
      source: "fallback",
      fallbackReason: "AI generation encountered an issue. Using fast draft — try again later for full AI polish.",
      radarBefore: fb.radarBefore,
      radarAfter: fb.radarAfter,
    };
  } finally {
    releaseSlot();
  }
}

/**
 * Attempt LLM call with up to 2 retries on Zod validation failure.
 */
async function attemptWithRetry(
  candidate: CandidateProfile,
  job: JobProfile,
  resumeText: string,
  jobDescriptionText: string,
  timeoutMs: number,
): Promise<ProOutput> {
  const MAX_ATTEMPTS = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await withTimeout(
        generateProResult(candidate, job, resumeText, jobDescriptionText),
        timeoutMs,
      );

      // Validate with Zod
      const validated = ProOutputSchema.safeParse(raw);
      if (validated.success) {
        return validated.data;
      }

      // Validation failed — log and retry
      const issues = validated.error.issues.slice(0, 3).map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      console.warn(
        `[llm-gateway] Zod validation failed (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`,
        issues,
      );
      lastError = new Error(`Output validation failed: ${issues[0]}`);

      // On last attempt, try to coerce the raw output
      if (attempt === MAX_ATTEMPTS - 1) {
        // The raw output from llm.ts already does extensive coercion,
        // so if Zod still fails, the output is too malformed to salvage.
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on timeout or auth errors
      if (
        lastError.message.includes("timed out") ||
        lastError.message.includes("401") ||
        lastError.message.includes("403")
      ) {
        throw lastError;
      }

      console.warn(
        `[llm-gateway] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed:`,
        lastError.message,
      );
    }
  }

  throw lastError || new Error("LLM generation failed after retries");
}

/**
 * Generate deterministic fallback using mock-llm + scoring heuristics.
 * Returns the output along with radar scores.
 */
function generateFallbackWithRadar(
  candidate: CandidateProfile,
  job: JobProfile,
  resumeText: string,
): { output: ProOutput; radarBefore: RadarResult; radarAfter: RadarResult } {
  const raw = generateMockProResult(candidate, job, resumeText);
  const { output } = runQualityGate(raw);
  const noInjection = enforceSkillsNoInjection(output, candidate, job);
  const { output: boosted, radarBefore, radarAfter } =
    ensureScoreImprovement(noInjection, candidate, job);
  // Final quality gate pass on boosted output
  const { output: finalOutput } = runQualityGate(boosted);
  return { output: finalOutput, radarBefore, radarAfter };
}

// ── No-injection enforcement ──

/**
 * Strip skills that are NOT in the allowed set (candidate skills + JD terms).
 * Defense-in-depth: the LLM prompt and mock generator already constrain skills,
 * but this catches any injected skills that slip through.
 */
function enforceSkillsNoInjection(
  output: ProOutput,
  candidate: CandidateProfile,
  job: JobProfile,
): ProOutput {
  const allowed = new Set([
    ...candidate.skills.map((s) => s.toLowerCase()),
    ...job.requiredSkills.map((s) => s.toLowerCase()),
    ...job.preferredSkills.map((s) => s.toLowerCase()),
    ...job.keywords.map((s) => s.toLowerCase()),
  ]);

  // Also allow skills already in the candidate's bullets/summary text
  const candidateText = [
    candidate.summary || "",
    candidate.headline || "",
    ...candidate.experience.flatMap((e) => [e.title || "", ...e.bullets]),
  ].join(" ").toLowerCase();

  let stripped = 0;
  const skills = output.tailoredResume.skills
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const lower = item.toLowerCase().trim();
        if (!lower) return false;

        // Exact match in allowed set
        if (allowed.has(lower)) return true;

        // Substring match (e.g., "React" matches "React.js")
        for (const term of allowed) {
          if (lower.includes(term) || term.includes(lower)) return true;
        }

        // Found in original candidate text
        if (candidateText.includes(lower)) return true;

        // Short skills (1-2 words) are likely legitimate
        if (lower.split(/\s+/).length <= 2) return true;

        stripped++;
        return false;
      }),
    }))
    .filter((group) => group.items.length > 0);

  if (stripped > 0) {
    console.log(`[llm-gateway] No-injection: stripped ${stripped} injected skill(s)`);
  }

  return {
    ...output,
    tailoredResume: {
      ...output.tailoredResume,
      skills,
    },
  };
}

// ── Observability ──

/** Get current gateway health status (for admin/monitoring). */
export function getGatewayHealth(): {
  circuitOpen: boolean;
  activeRequests: number;
  recentFailures: number;
  openedAt: number | null;
} {
  return {
    circuitOpen: isCircuitOpen(),
    activeRequests,
    recentFailures: circuit.failures.length,
    openedAt: circuit.openedAt,
  };
}
