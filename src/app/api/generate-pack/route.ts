import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { generateProDocuments } from "@/lib/llm-gateway";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { parseAndValidate, GeneratePackRequestSchema } from "@/lib/sanitizer";
import { preprocessResume, preprocessJobDescription } from "@/lib/input-preprocessor";
import { proCache, hashInputs } from "@/lib/cache";
import { checkRelevance } from "@/lib/radar-scorer";
import { trackServerEvent } from "@/lib/analytics-server";
import { verifyEntitlement, decrementQuota, checkEntitlementBurst } from "@/lib/entitlement";
import { validateJD } from "@/lib/jd-validator";
import type { ProOutput } from "@/lib/schema";

/**
 * NDJSON Streaming Bulk CV Generator
 *
 * Architecture:
 * - Single HTTP POST -> NDJSON stream response
 * - Resume parsed ONCE, reused across all jobs
 * - Jobs processed in parallel batches (max 3 concurrent via gateway)
 * - Each stage transition streamed to client in real-time
 * - Cache-hit results sent immediately (0ms latency)
 * - Uses LLM Gateway for circuit breaking and fallback
 */

const PACK_CONCURRENCY = 3;

type StreamEvent =
  | { type: "stage"; index: number; title: string; stage: string; pct: number }
  | { type: "result"; index: number; title: string; status: "done" | "error"; output?: ProOutput; source?: string; notice?: string; error?: string; pct: number }
  | { type: "done"; completed: number; failed: number; elapsed: string }
  | { type: "error"; message: string };

export async function POST(request: Request) {
  // Pre-stream validation (returns JSON errors before streaming starts)
  const { response: rateLimited } = rateLimitRoute(request, "generate-pack");
  if (rateLimited) return rateLimited;

  if (process.env.NEXT_PUBLIC_PRO_ENABLED === "false") {
    return Response.json(
      { error: "Pro features are currently disabled." },
      { status: 403 },
    );
  }

  // ── Entitlement check (enforced in production, skipped in dev) ──
  const enforceEntitlement =
    process.env.NODE_ENV === "production" && process.env.ENFORCE_ENTITLEMENT !== "false";

  const authHeader = request.headers.get("authorization");
  const entitlementToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (enforceEntitlement) {
    if (!entitlementToken) {
      return Response.json(
        { error: "Pick a Pro or Career Pass plan to use the Bulk CV Generator.", code: "NO_ENTITLEMENT" },
        { status: 402 },
      );
    }
    const claims = verifyEntitlement(entitlementToken);
    if (!claims) {
      return Response.json(
        { error: "Entitlement expired or invalid.", code: "EXPIRED" },
        { status: 402 },
      );
    }
    if (claims.quotaRemaining <= 0) {
      return Response.json(
        {
          error: claims.plan === "pro"
            ? "Pro quota exhausted. Upgrade to Career Pass for 50 jobs."
            : "Career Pass quota exhausted.",
          code: "QUOTA_EXHAUSTED",
          plan: claims.plan,
        },
        { status: 402 },
      );
    }
    if (!checkEntitlementBurst(claims.id, claims.plan)) {
      return Response.json(
        { error: "Too many generations in a short time. Please wait a few minutes.", code: "BURST_LIMIT" },
        { status: 429 },
      );
    }
  }

  const { data, error } = await parseAndValidate(
    request,
    GeneratePackRequestSchema,
    "generate-pack",
  );
  if (error) return error;

  const { jobs } = data;

  // Start NDJSON stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  async function send(event: StreamEvent) {
    try {
      await writer.write(encoder.encode(JSON.stringify(event) + "\n"));
    } catch {
      // Client disconnected
    }
  }

  const processAsync = async () => {
    const startTime = Date.now();
    let completed = 0;
    let failed = 0;
    let currentToken = entitlementToken; // Track token across quota decrements

    try {
      // Parse resume ONCE
      const resumeText = preprocessResume(data.resumeText);
      const candidateProfile = parseResume(resumeText);

      trackServerEvent("pack_generation_started", { jobCount: jobs.length });
      console.log(
        `[generate-pack] Starting: ${jobs.length} jobs, resume: ${resumeText.length} chars`,
      );

      // Separate cached vs uncached
      const uncachedJobs: Array<{
        index: number;
        title: string;
        jdText: string;
      }> = [];

      for (let i = 0; i < jobs.length; i++) {
        const jdText = preprocessJobDescription(jobs[i].jd);
        const cacheKey = hashInputs("pro", resumeText, jdText);
        const cached = proCache.get(cacheKey);

        if (cached) {
          await send({
            type: "result",
            index: i,
            title: jobs[i].title,
            status: "done",
            output: cached as ProOutput,
            source: "cache",
            pct: 100,
          });
          completed++;
        } else {
          await send({
            type: "stage",
            index: i,
            title: jobs[i].title,
            stage: "queued",
            pct: 0,
          });
          uncachedJobs.push({ index: i, title: jobs[i].title, jdText });
        }
      }

      // Parallel batches via gateway
      for (
        let batch = 0;
        batch < uncachedJobs.length;
        batch += PACK_CONCURRENCY
      ) {
        const batchJobs = uncachedJobs.slice(batch, batch + PACK_CONCURRENCY);

        const batchResults = await Promise.allSettled(
          batchJobs.map(async ({ index, title, jdText }) => {
            await send({
              type: "stage",
              index,
              title,
              stage: "parsing",
              pct: 10,
            });

            // Validate JD quality
            const jdValidation = validateJD(jdText);
            if (!jdValidation.valid) {
              throw new Error(jdValidation.reason || "Invalid job description");
            }

            const jobProfile = parseJobDescription(jdText);

            const relevance = checkRelevance(candidateProfile, jobProfile);
            if (!relevance.relevant) {
              console.log(
                `[generate-pack] Job ${index} low relevance (${relevance.score}%)`,
              );
            }

            await send({
              type: "stage",
              index,
              title,
              stage: "generating",
              pct: 15,
            });

            // Use gateway instead of direct LLM call
            const { output, source, fallbackReason } = await generateProDocuments(
              candidateProfile,
              jobProfile,
              resumeText,
              jdText,
              { timeoutMs: 120_000 }, // 2min timeout for pack (LLM can take 60-90s)
            );

            // Cache for future requests
            const cacheKey = hashInputs("pro", resumeText, jdText);
            proCache.set(cacheKey, output);

            return { index, title, output, source, fallbackReason };
          }),
        );

        for (let i = 0; i < batchResults.length; i++) {
          const settled = batchResults[i];
          const job = batchJobs[i];

          if (settled.status === "fulfilled") {
            const { index, title, output, source, fallbackReason } = settled.value;

            // Decrement quota per successful generation
            if (enforceEntitlement && currentToken) {
              const dec = decrementQuota(currentToken);
              if (dec) currentToken = dec.newToken;
            }

            await send({
              type: "result",
              index,
              title,
              status: "done",
              output,
              source,
              notice: fallbackReason,
              pct: 100,
            });
            completed++;
          } else {
            const errMsg =
              settled.reason instanceof Error
                ? settled.reason.message
                : "Generation failed";
            await send({
              type: "result",
              index: job.index,
              title: job.title,
              status: "error",
              error: "Generation encountered an issue. Please try again.",
              pct: 100,
            });
            failed++;
            console.error(`[generate-pack] Job ${job.index} failed:`, errMsg);
          }
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `[generate-pack] Done: ${completed}/${jobs.length} in ${elapsed}s`,
      );
      trackServerEvent("pack_generation_completed", {
        completed,
        failed,
        elapsed,
      });
      await send({ type: "done", completed, failed, elapsed: `${elapsed}s` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[generate-pack] Fatal:", msg);
      await send({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  };

  processAsync();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
