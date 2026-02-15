/**
 * JD Validator — guardrails for job description input.
 *
 * Validates:
 * - Minimum length (>200 chars unless has clear responsibilities + skills)
 * - Not gibberish/repeated chars/lorem ipsum
 * - Contains some parseable structure
 */

export interface JDValidationResult {
  valid: boolean;
  reason?: string;
  warnings: string[];
}

const MIN_LENGTH = 200;
const MIN_LENGTH_WITH_STRUCTURE = 80;

/**
 * Validate a job description text before generation.
 */
export function validateJD(text: string): JDValidationResult {
  const trimmed = text.trim();
  const warnings: string[] = [];

  // Empty or too short
  if (!trimmed) {
    return { valid: false, reason: "Job description is empty. Please paste the full job listing.", warnings };
  }

  // Gibberish detection: repeated characters
  if (/(.)\1{10,}/.test(trimmed)) {
    return { valid: false, reason: "Job description appears to contain repeated characters. Please paste a real job listing.", warnings };
  }

  // Lorem ipsum detection
  if (/lorem\s+ipsum/i.test(trimmed)) {
    return { valid: false, reason: "Job description appears to be placeholder text. Please paste a real job listing.", warnings };
  }

  // Detect if it has some structure (bullets, skills, responsibilities)
  const hasBullets = /[•·●▪◦\-–—*]\s*.{10,}/.test(trimmed);
  const hasSkillWords = /\b(skills?|requirements?|qualifications?|experience|responsibilities)\b/i.test(trimmed);
  const hasStructure = hasBullets || hasSkillWords;

  // Length check
  if (trimmed.length < MIN_LENGTH_WITH_STRUCTURE && hasStructure) {
    warnings.push("Job description is very short. Results may be limited.");
  } else if (trimmed.length < MIN_LENGTH && !hasStructure) {
    return {
      valid: false,
      reason: `Job description is too short (${trimmed.length} characters). Please include the full job listing with responsibilities and requirements.`,
      warnings,
    };
  }

  // Too short overall even with structure
  if (trimmed.length < 50) {
    return {
      valid: false,
      reason: "Job description is too short. Please paste the full job listing.",
      warnings,
    };
  }

  // Warning: no clear requirements section
  if (!hasSkillWords) {
    warnings.push("No clear requirements or qualifications section detected. Results may be less targeted.");
  }

  // Warning: very few distinct words (possible garbage)
  const words = new Set(trimmed.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  if (words.size < 15 && trimmed.length > 100) {
    warnings.push("Job description has very low word variety. Please check it is a complete listing.");
  }

  return { valid: true, warnings };
}
