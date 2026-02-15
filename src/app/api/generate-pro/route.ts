import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { generateProDocuments } from "@/lib/llm-gateway";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { parseAndValidate, GenerateProRequestSchema } from "@/lib/sanitizer";
import { preprocessResume, preprocessJobDescription } from "@/lib/input-preprocessor";
import { proCache, hashInputs } from "@/lib/cache";
import { verifyEntitlement, decrementQuota, checkEntitlementBurst } from "@/lib/entitlement";
import { checkRelevance } from "@/lib/radar-scorer";
import { trackServerEvent } from "@/lib/analytics-server";
import { validateJD } from "@/lib/jd-validator";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const { response: rateLimited } = rateLimitRoute(request, "generate-pro");
    if (rateLimited) return rateLimited;

    // Check if Pro is enabled
    if (process.env.NEXT_PUBLIC_PRO_ENABLED === "false") {
      return NextResponse.json(
        { error: "Pro features are currently disabled." },
        { status: 403 }
      );
    }

    // Parse + validate + sanitize input
    const { data, error } = await parseAndValidate(request, GenerateProRequestSchema, "generate-pro");
    if (error) return error;

    // ── Entitlement check (enforced in production, skipped in dev) ──
    const enforceEntitlement =
      process.env.NODE_ENV === "production" && process.env.ENFORCE_ENTITLEMENT !== "false";

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (enforceEntitlement) {
      if (!token) {
        return NextResponse.json(
          { error: "Entitlement required. Choose a plan to continue.", code: "NO_ENTITLEMENT" },
          { status: 402 },
        );
      }

      const claims = verifyEntitlement(token);
      if (!claims) {
        return NextResponse.json(
          { error: "Entitlement expired or invalid. Please purchase again.", code: "EXPIRED" },
          { status: 402 },
        );
      }

      if (claims.quotaRemaining <= 0) {
        return NextResponse.json(
          {
            error: claims.plan === "pro"
              ? "You've used all Pro generations. Upgrade to Career Pass for 50 jobs."
              : "Career Pass quota exhausted. Purchase another pass to continue.",
            code: "QUOTA_EXHAUSTED",
            plan: claims.plan,
          },
          { status: 402 },
        );
      }

      // Per-entitlement burst limit (3 jobs per 10min)
      if (!checkEntitlementBurst(claims.id, claims.plan)) {
        return NextResponse.json(
          { error: "Too many generations in a short time. Please wait a few minutes.", code: "BURST_LIMIT" },
          { status: 429 },
        );
      }
    }

    // Preprocess inputs
    const resumeText = preprocessResume(data.resumeText);
    const jobDescriptionText = preprocessJobDescription(data.jobDescriptionText);

    // Validate JD quality
    const jdValidation = validateJD(jobDescriptionText);
    if (!jdValidation.valid) {
      return NextResponse.json(
        { error: jdValidation.reason },
        { status: 400 },
      );
    }
    if (jdValidation.warnings.length > 0) {
      console.log("[generate-pro] JD validation warnings:", jdValidation.warnings);
    }

    // Check cache
    const cacheKey = hashInputs("pro", resumeText, jobDescriptionText);
    const cached = proCache.get(cacheKey);
    if (cached) {
      console.log("[generate-pro] Cache hit");
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT", "X-Source": "cache" },
      });
    }

    trackServerEvent("pro_generation_started");

    // Parse inputs
    const candidateProfile = parseResume(resumeText);
    const jobProfile = parseJobDescription(jobDescriptionText);

    // Log relevance for diagnostics
    const relevance = checkRelevance(candidateProfile, jobProfile);
    if (!relevance.relevant) {
      console.log(
        `[generate-pro] Low relevance (${relevance.score}%) — proceeding with user permission`,
      );
    }

    // Generate via LLM Gateway (handles circuit breaker, concurrency, timeout, fallback, score boost)
    const { output, source, fallbackReason, radarBefore, radarAfter } = await generateProDocuments(
      candidateProfile,
      jobProfile,
      resumeText,
      jobDescriptionText,
      { timeoutMs: 120_000 }, // 2min timeout (LLM can take 60-90s)
    );

    // Store in cache
    proCache.set(cacheKey, output);

    // ── Decrement entitlement quota (only in production with valid token) ──
    let updatedToken: string | undefined;
    let updatedClaims: { quotaRemaining: number; plan: string } | undefined;
    if (enforceEntitlement && token) {
      const result = decrementQuota(token);
      if (result) {
        updatedToken = result.newToken;
        updatedClaims = { quotaRemaining: result.claims.quotaRemaining, plan: result.claims.plan };
      }
    }

    console.log("[generate-pro] Complete", {
      source,
      bulletRewrites: output.bulletRewrites.length,
      keywords: output.keywordChecklist.length,
      ...(updatedClaims ? { quotaRemaining: updatedClaims.quotaRemaining } : {}),
    });

    return NextResponse.json(
      {
        ...output,
        _meta: {
          source,
          ...(fallbackReason ? { notice: fallbackReason } : {}),
        },
        _radar: {
          ...(radarBefore ? { before: radarBefore } : {}),
          ...(radarAfter ? { after: radarAfter } : {}),
        },
        ...(updatedToken ? { _entitlement: { token: updatedToken, ...updatedClaims } } : {}),
      },
      {
        headers: {
          "X-Cache": "MISS",
          "X-Source": source,
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-pro] Error:", message);
    // Never surface raw provider errors
    return NextResponse.json(
      { error: "Something went wrong generating your results. Please try again." },
      { status: 500 },
    );
  }
}
