import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { parseJobDescription } from "@/lib/jd-parser";
import { generateProResult } from "@/lib/llm";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    // Rate limiting - stricter for Pro generation
    const ip = getClientIP(request);
    const { allowed } = checkRateLimit(ip, {
      maxRequests: 5,
      windowMs: 60_000,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // Check if Pro is enabled
    if (process.env.NEXT_PUBLIC_PRO_ENABLED === "false") {
      return NextResponse.json(
        { error: "Pro features are currently disabled." },
        { status: 403 }
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

    if (resumeText.length > 50_000 || jobDescriptionText.length > 30_000) {
      return NextResponse.json(
        { error: "Input too long." },
        { status: 400 }
      );
    }

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

    // Do NOT log raw content
    console.log("[generate-pro] Pro generation complete", {
      bulletRewrites: result.bulletRewrites.length,
      keywordChecklist: result.keywordChecklist.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate-pro] Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred during Pro generation. Please try again." },
      { status: 500 }
    );
  }
}
