import type { CandidateProfile, JobProfile, ProGenerationResult } from "./types";
import { generateMockProResult } from "./mock-llm";

const MAX_RETRIES = 2;

/**
 * Generate Pro results using Claude API (or mock mode).
 * Falls back to mock/deterministic output on failure.
 */
export async function generateProResult(
  candidate: CandidateProfile,
  job: JobProfile,
  resumeText: string,
  jobDescriptionText: string
): Promise<ProGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = process.env.MOCK_LLM === "true" || !apiKey;

  if (useMock) {
    console.log("[llm] Using mock LLM mode");
    return generateMockProResult(candidate, job, resumeText);
  }

  // Real LLM mode
  console.log("[llm] Using Anthropic Claude API");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callClaude(candidate, job, resumeText, jobDescriptionText, apiKey, attempt > 0);
      return result;
    } catch (error) {
      console.error(`[llm] Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : "Unknown");
      if (attempt === MAX_RETRIES) {
        console.log("[llm] All retries failed, falling back to deterministic output");
        return generateMockProResult(candidate, job, resumeText);
      }
    }
  }

  // Should never reach here, but fallback just in case
  return generateMockProResult(candidate, job, resumeText);
}

async function callClaude(
  candidate: CandidateProfile,
  job: JobProfile,
  resumeText: string,
  jobDescriptionText: string,
  apiKey: string,
  strict: boolean
): Promise<ProGenerationResult> {
  const systemPrompt = `You are an expert resume consultant and career coach. You analyze resumes against job descriptions and provide detailed, actionable feedback.

CRITICAL: You must respond with ONLY valid JSON matching the exact schema below. No markdown, no explanation, no code fences - ONLY the JSON object.
${strict ? "\nThis is a RETRY because your previous response was not valid JSON. Respond with ONLY the JSON object, nothing else." : ""}

Response JSON schema:
{
  "tailoredResume": "string - the full rewritten resume as plain text",
  "coverLetter": "string - a tailored cover letter",
  "keywordChecklist": [{"keyword": "string", "found": boolean, "section": "string or null", "suggestion": "string or null"}],
  "recruiterFeedback": "string - markdown formatted recruiter assessment",
  "bulletRewrites": [{"original": "string", "rewritten": "string", "section": "string", "notes": "string"}],
  "skillsSectionRewrite": "string - reformatted skills section",
  "experienceGaps": [{"gap": "string", "suggestion": "string", "severity": "high|medium|low"}],
  "nextActions": ["string - actionable next step"],
  "summary": "string - executive summary of the analysis"
}

Rules:
- Do NOT invent metrics or achievements - use [X] placeholders for numbers the candidate should fill in
- Do NOT include any content outside the JSON
- Keep suggestions specific and actionable
- Cover letter should be professional but not generic
- Bullet rewrites should use strong action verbs and quantify impact where possible`;

  const userPrompt = `Analyze this resume against the job description and provide a complete Pro analysis.

RESUME:
${resumeText.slice(0, 8000)}

JOB DESCRIPTION:
${jobDescriptionText.slice(0, 5000)}

PARSED CANDIDATE PROFILE:
Name: ${candidate.name || "Unknown"}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experience.map((e) => `${e.title} at ${e.company}`).join("; ")}

PARSED JOB PROFILE:
Title: ${job.title || "Unknown"}
Company: ${job.company || "Unknown"}
Required: ${job.requiredSkills.join("; ")}
Keywords: ${job.keywords.join(", ")}

Respond with ONLY the JSON object.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      messages: [
        { role: "user", content: userPrompt },
      ],
      system: systemPrompt,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Claude API error ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("Empty response from Claude API");
  }

  // Parse JSON - handle potential markdown code fences
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  // Validate required fields
  if (!parsed.tailoredResume || !parsed.coverLetter || !parsed.summary) {
    throw new Error("Missing required fields in LLM response");
  }

  // Ensure arrays exist
  return {
    tailoredResume: String(parsed.tailoredResume),
    coverLetter: String(parsed.coverLetter),
    keywordChecklist: Array.isArray(parsed.keywordChecklist) ? parsed.keywordChecklist : [],
    recruiterFeedback: String(parsed.recruiterFeedback || ""),
    bulletRewrites: Array.isArray(parsed.bulletRewrites) ? parsed.bulletRewrites : [],
    skillsSectionRewrite: String(parsed.skillsSectionRewrite || ""),
    experienceGaps: Array.isArray(parsed.experienceGaps) ? parsed.experienceGaps : [],
    nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [],
    summary: String(parsed.summary),
  };
}
