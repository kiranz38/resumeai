import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { scoreATS, generateStrengths, generateGaps, generateRewritePreviews } from "@/lib/ats-scorer";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import type { FreeAnalysisResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(ip, {
      maxRequests: 20,
      windowMs: 60_000,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": "0" },
        }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescriptionText } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    if (!jobDescriptionText || typeof jobDescriptionText !== "string") {
      return NextResponse.json(
        { error: "Job description text is required." },
        { status: 400 }
      );
    }

    // Validate lengths (prevent abuse)
    if (resumeText.length > 50_000) {
      return NextResponse.json(
        { error: "Resume text is too long. Please limit to 50,000 characters." },
        { status: 400 }
      );
    }

    if (jobDescriptionText.length > 30_000) {
      return NextResponse.json(
        { error: "Job description is too long. Please limit to 30,000 characters." },
        { status: 400 }
      );
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

    // Do NOT log raw resume or JD content
    console.log("[analyze] Analysis complete", {
      score: atsResult.score,
      matchedKeywords: atsResult.matchedKeywords.length,
      missingKeywords: atsResult.missingKeywords.length,
    });

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
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
