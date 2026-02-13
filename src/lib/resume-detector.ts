/**
 * Lightweight client-side heuristic to detect if uploaded text
 * looks like a resume vs a random document.
 */

const RESUME_SIGNALS = [
  // Section headers
  /\b(experience|work\s+experience|professional\s+experience|employment)\b/i,
  /\b(education|academic|university|college|degree|bachelor|master|phd)\b/i,
  /\b(skills|technical\s+skills|core\s+competencies|proficiencies)\b/i,
  /\b(summary|objective|profile|about\s+me)\b/i,
  /\b(certifications?|licenses?|awards?|honors?)\b/i,
  /\b(projects?|portfolio|publications?)\b/i,
  // Contact info patterns
  /[\w.-]+@[\w.-]+\.\w{2,}/,          // email
  /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/, // phone
  /linkedin\.com/i,
  // Job-related terms
  /\b(managed|developed|implemented|designed|led|created|built|improved|reduced|increased)\b/i,
  /\b(responsible\s+for|collaborated|coordinated|delivered|achieved)\b/i,
  /\b(intern|engineer|developer|manager|analyst|designer|consultant|director|associate)\b/i,
];

const MIN_SIGNALS_REQUIRED = 3;

export interface ResumeDetectionResult {
  isLikelyResume: boolean;
  confidence: "high" | "medium" | "low";
  signalsFound: number;
  message?: string;
}

/**
 * Check if text content looks like a resume.
 */
export function detectResume(text: string): ResumeDetectionResult {
  if (!text || text.length < 50) {
    return {
      isLikelyResume: false,
      confidence: "low",
      signalsFound: 0,
      message: "The uploaded content is too short to be a resume.",
    };
  }

  let signalsFound = 0;
  for (const pattern of RESUME_SIGNALS) {
    if (pattern.test(text)) {
      signalsFound++;
    }
  }

  if (signalsFound >= 6) {
    return { isLikelyResume: true, confidence: "high", signalsFound };
  }

  if (signalsFound >= MIN_SIGNALS_REQUIRED) {
    return { isLikelyResume: true, confidence: "medium", signalsFound };
  }

  return {
    isLikelyResume: false,
    confidence: "low",
    signalsFound,
    message: "This doesn't look like a resume. Please upload your resume (PDF, DOCX, or TXT).",
  };
}
