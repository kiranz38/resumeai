import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { generateProDocuments } from "@/lib/llm-gateway";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { parseAndValidate, GenerateProRequestSchema } from "@/lib/sanitizer";
import { preprocessResume, preprocessJobDescription } from "@/lib/input-preprocessor";
import { proCache, hashInputs } from "@/lib/cache";
import { validateJD } from "@/lib/jd-validator";

/**
 * Speculative pre-generation endpoint.
 *
 * Called client-side when a user clicks "Upgrade" — BEFORE they
 * complete Stripe checkout.  Starts the LLM generation in the
 * background so the result is already cached when /api/generate-pro
 * is called after payment.
 *
 * Returns immediately (202 Accepted); generation runs fire-and-forget.
 * No entitlement required — rate-limited strictly (5/hour per IP).
 */
export async function POST(request: Request) {
  try {
    const { response: rateLimited } = rateLimitRoute(request, "pre-generate");
    if (rateLimited) return rateLimited;

    if (process.env.NEXT_PUBLIC_PRO_ENABLED === "false") {
      return NextResponse.json({ status: "disabled" }, { status: 200 });
    }

    const { data, error } = await parseAndValidate(request, GenerateProRequestSchema, "pre-generate");
    if (error) return error;

    const resumeText = preprocessResume(data.resumeText);
    const jobDescriptionText = preprocessJobDescription(data.jobDescriptionText);

    const jdValidation = validateJD(jobDescriptionText);
    if (!jdValidation.valid) {
      return NextResponse.json({ status: "invalid_jd" }, { status: 400 });
    }

    // Already cached? Nothing to do.
    const cacheKey = hashInputs("pro", resumeText, jobDescriptionText);
    if (proCache.has(cacheKey)) {
      return NextResponse.json({ status: "cached" }, { status: 200 });
    }

    // Fire-and-forget: start generation in the background.
    // The result lands in proCache, which generate-pro checks first.
    const candidateProfile = parseResume(resumeText);
    const jobProfile = parseJobDescription(jobDescriptionText);

    // Don't await — let it run while user completes checkout
    generateProDocuments(
      candidateProfile,
      jobProfile,
      resumeText,
      jobDescriptionText,
      { timeoutMs: 180_000 },
    )
      .then(({ output }) => {
        proCache.set(cacheKey, output);
        console.log("[pre-generate] Background generation complete — cached");
      })
      .catch((err) => {
        console.error("[pre-generate] Background generation failed:", err instanceof Error ? err.message : err);
      });

    return NextResponse.json({ status: "started" }, { status: 202 });
  } catch (err) {
    console.error("[pre-generate] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
