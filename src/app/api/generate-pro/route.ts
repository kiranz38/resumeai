import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { generateProResult } from "@/lib/llm";
import { rateLimitRoute, acquireLLMSlot, releaseLLMSlot } from "@/lib/rate-limiter";
import { parseAndValidate, GenerateProRequestSchema } from "@/lib/sanitizer";
import { preprocessResume, preprocessJobDescription } from "@/lib/input-preprocessor";
import { proCache, hashInputs } from "@/lib/cache";
import { verifyEntitlementToken } from "@/lib/entitlement";

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

    // Verify entitlement token if ENFORCE_ENTITLEMENT is set
    if (process.env.ENFORCE_ENTITLEMENT === "true") {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token || !verifyEntitlementToken(token)) {
        return NextResponse.json(
          { error: "Valid entitlement token required. Please complete payment first." },
          { status: 403 }
        );
      }
    }

    // Preprocess inputs
    const resumeText = preprocessResume(data.resumeText);
    const jobDescriptionText = preprocessJobDescription(data.jobDescriptionText);

    // Check cache
    const cacheKey = hashInputs("pro", resumeText, jobDescriptionText);
    const cached = proCache.get(cacheKey);
    if (cached) {
      console.log("[generate-pro] Cache hit");
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    // Concurrency guard for LLM
    if (!acquireLLMSlot()) {
      return NextResponse.json(
        { error: "Server is busy. Please try again in a moment." },
        { status: 503 }
      );
    }

    try {
      // Parse inputs
      const candidateProfile = parseResume(resumeText);
      const jobProfile = parseJobDescription(jobDescriptionText);

      // Generate Pro result (mock or real LLM)
      const result = await generateProResult(
        candidateProfile,
        jobProfile,
        resumeText,
        jobDescriptionText
      );

      // Store in cache
      proCache.set(cacheKey, result);

      console.log("[generate-pro] Pro generation complete", {
        bulletRewrites: result.bulletRewrites.length,
        keywords: result.keywordChecklist.length,
      });

      return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
    } finally {
      releaseLLMSlot();
    }
  } catch (error) {
    console.error("[generate-pro] Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred during Pro generation. Please try again." },
      { status: 500 }
    );
  }
}
