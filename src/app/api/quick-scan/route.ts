import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resume-parser";
import { scoreATS, generateStrengths, generateGaps, generateRewritePreviews } from "@/lib/ats-scorer";
import { scoreRadar } from "@/lib/radar-scorer";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { parseAndValidate, QuickScanRequestSchema } from "@/lib/sanitizer";
import { preprocessResume } from "@/lib/input-preprocessor";
import { quickScanCache, hashInputs } from "@/lib/cache";
import { extractTargetRole, findMatchingProfiles, roleProfileToJobProfile } from "@/lib/role-profiles/matcher";
import type { QuickScanResult, RoleMatch } from "@/lib/role-profiles/types";

const FREE_TIER_CAP = 60;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const { response: rateLimited, result: rlResult } = rateLimitRoute(request, "analyze");
    if (rateLimited) return rateLimited;

    // Parse + validate + sanitize input
    const { data, error } = await parseAndValidate(request, QuickScanRequestSchema, "quick-scan");
    if (error) return error;

    // Preprocess resume
    const resumeText = preprocessResume(data.resumeText);

    // Check cache
    const cacheKey = hashInputs(resumeText, "__quick_scan__");
    const cached = quickScanCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-RateLimit-Remaining": rlResult.remaining.toString(),
          "X-Cache": "HIT",
        },
      });
    }

    // Parse resume
    const candidateProfile = parseResume(resumeText);

    // Extract target role from CV
    const { title, seniority, skills } = extractTargetRole(candidateProfile);

    // Find matching role profiles (8-10 including aspirational roles)
    const matchingProfiles = findMatchingProfiles(title, skills, seniority, undefined, 10);

    if (matchingProfiles.length === 0) {
      return NextResponse.json(
        { error: "Could not determine a matching role from your resume. Please try the detailed analysis with a job description." },
        { status: 422 },
      );
    }

    // Score CV against each matching role profile
    const roleMatches: RoleMatch[] = matchingProfiles.map((profile) => {
      const jobProfile = roleProfileToJobProfile(profile);

      const rawRadar = scoreRadar(candidateProfile, jobProfile);
      const atsResult = scoreATS(candidateProfile, jobProfile);

      // Apply free-tier cap
      const cappedScore = Math.min(rawRadar.score, FREE_TIER_CAP);

      return {
        profile,
        score: cappedScore,
        radarBreakdown: {
          hardSkills: Math.min(rawRadar.breakdown.hardSkills, 65),
          softSkills: Math.min(rawRadar.breakdown.softSkills, 70),
          measurableResults: Math.min(rawRadar.breakdown.measurableResults, 60),
          keywordOptimization: Math.min(rawRadar.breakdown.keywordOptimization, 55),
          formattingBestPractices: Math.min(rawRadar.breakdown.formattingBestPractices, 70),
        },
        missingSkills: atsResult.missingKeywords.slice(0, 10),
        missingKeywords: rawRadar.atsCompat.missingKeywords.slice(0, 15),
        matchedSkills: atsResult.matchedKeywords.slice(0, 10),
      };
    });

    // Sort by score descending
    roleMatches.sort((a, b) => b.score - a.score);

    // Generate strengths/gaps/rewrites using best-match profile
    const bestMatchJobProfile = roleProfileToJobProfile(roleMatches[0].profile);
    const bestATS = scoreATS(candidateProfile, bestMatchJobProfile);
    const strengths = generateStrengths(candidateProfile, bestMatchJobProfile);
    const gaps = generateGaps(candidateProfile, bestMatchJobProfile, bestATS.missingKeywords);
    const rewritePreviews = generateRewritePreviews(candidateProfile);

    // Extract formatting issues from gaps (filter to formatting-specific items)
    const formattingIssues = gaps.filter((g) =>
      /summary|format|bullet|action verb|section|length|metric|quantif/i.test(g),
    );

    const result: QuickScanResult = {
      candidateProfile,
      roleMatches,
      generalStrengths: strengths,
      formattingIssues: formattingIssues.length > 0 ? formattingIssues : gaps.slice(0, 3),
      rewritePreviews,
      bestMatchScore: roleMatches[0].score,
      bestMatchRole: roleMatches[0].profile.normalizedTitle,
    };

    // Cache result
    quickScanCache.set(cacheKey, result);

    console.log("[quick-scan] Scan complete", {
      extractedRole: title,
      seniority,
      matchCount: roleMatches.length,
      bestMatch: roleMatches[0].profile.normalizedTitle,
      bestScore: roleMatches[0].score,
    });

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": rlResult.remaining.toString(),
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[quick-scan] Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred during quick scan. Please try again." },
      { status: 500 },
    );
  }
}
