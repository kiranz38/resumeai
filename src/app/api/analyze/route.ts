import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { scoreATS, generateStrengths, generateGaps, generateRewritePreviews } from "@/lib/ats-scorer";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { parseAndValidate, AnalyzeRequestSchema } from "@/lib/sanitizer";
import { preprocessResume, preprocessJobDescription } from "@/lib/input-preprocessor";
import { analysisCache, hashInputs } from "@/lib/cache";
import type { FreeAnalysisResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const { response: rateLimited, result: rlResult } = rateLimitRoute(request, "analyze");
    if (rateLimited) return rateLimited;

    // Parse + validate + sanitize input
    const { data, error } = await parseAndValidate(request, AnalyzeRequestSchema, "analyze");
    if (error) return error;

    // Preprocess inputs (normalize, truncate)
    const resumeText = preprocessResume(data.resumeText);
    const jobDescriptionText = preprocessJobDescription(data.jobDescriptionText);

    // Check cache
    const cacheKey = hashInputs(resumeText, jobDescriptionText);
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      console.log("[analyze] Cache hit");
      return NextResponse.json(cached, {
        headers: {
          "X-RateLimit-Remaining": rlResult.remaining.toString(),
          "X-Cache": "HIT",
        },
      });
    }

    // Parse inputs
    const candidateProfile = parseResume(resumeText);
    const jobProfile = parseJobDescription(jobDescriptionText);

    // Score
    const atsResult = scoreATS(candidateProfile, jobProfile);

    // Generate insights
    const strengths = generateStrengths(candidateProfile, jobProfile);
    const gaps = generateGaps(candidateProfile, jobProfile, atsResult.missingKeywords);
    const rewritePreviews = generateRewritePreviews(candidateProfile);

    const result: FreeAnalysisResult = {
      atsResult,
      candidateProfile,
      jobProfile,
      strengths,
      gaps,
      rewritePreviews,
    };

    // Store in cache
    analysisCache.set(cacheKey, result);

    console.log("[analyze] Analysis complete", {
      score: atsResult.score,
      matchedKeywords: atsResult.matchedKeywords.length,
      missingKeywords: atsResult.missingKeywords.length,
    });

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": rlResult.remaining.toString(),
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[analyze] Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred during analysis. Please try again." },
      { status: 500 }
    );
  }
}
