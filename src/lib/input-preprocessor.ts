/**
 * Large input preprocessing pipeline.
 * Normalizes, extracts sections, and intelligently truncates
 * resume/JD text before sending to the API or LLM.
 */

/**
 * Normalize text: strip null bytes, control chars, collapse whitespace.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\0/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Resume section names in priority order */
const RESUME_SECTIONS = [
  "experience", "work experience", "professional experience", "employment",
  "skills", "technical skills", "core competencies",
  "education", "academic background",
  "summary", "professional summary", "objective", "profile",
  "projects", "key projects",
  "certifications", "licenses",
  "awards", "honors",
];

interface ExtractedSections {
  sections: Map<string, string>;
  rawText: string;
}

/**
 * Extract sections from a resume by detecting common headings.
 */
export function extractResumeSections(text: string): ExtractedSections {
  const normalized = normalizeText(text);
  const sections = new Map<string, string>();
  const lines = normalized.split("\n");

  let currentSection = "header";
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase().replace(/[:\-_|]/g, "").trim();

    // Check if this line is a section heading
    const matchedSection = RESUME_SECTIONS.find(
      (s) => lower === s || lower.startsWith(s + " ")
    );

    if (matchedSection && trimmed.length < 60) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.set(currentSection, currentContent.join("\n").trim());
      }
      currentSection = matchedSection;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections.set(currentSection, currentContent.join("\n").trim());
  }

  return { sections, rawText: normalized };
}

/**
 * Intelligently truncate text to a target length, preserving structure.
 * Prefers keeping complete sections/paragraphs over mid-sentence cuts.
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to cut at a paragraph boundary
  const truncated = text.slice(0, maxLength);
  const lastParagraph = truncated.lastIndexOf("\n\n");
  if (lastParagraph > maxLength * 0.7) {
    return truncated.slice(0, lastParagraph).trim();
  }

  // Try to cut at a sentence boundary
  const lastSentence = truncated.lastIndexOf(". ");
  if (lastSentence > maxLength * 0.8) {
    return truncated.slice(0, lastSentence + 1).trim();
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.9) {
    return truncated.slice(0, lastSpace).trim();
  }

  return truncated.trim();
}

/**
 * Preprocess resume text: normalize → extract → smart truncate.
 */
export function preprocessResume(text: string, maxLength: number = 50_000): string {
  const normalized = normalizeText(text);
  return smartTruncate(normalized, maxLength);
}

/**
 * Preprocess job description text: normalize → smart truncate.
 */
export function preprocessJobDescription(text: string, maxLength: number = 30_000): string {
  const normalized = normalizeText(text);
  return smartTruncate(normalized, maxLength);
}

/**
 * Build a structured profile string for LLM consumption.
 * More token-efficient than sending raw text.
 */
export function buildStructuredResumeForLLM(text: string, maxLength: number = 8000): string {
  const { sections, rawText } = extractResumeSections(text);

  // Priority order: experience first, then skills, then other sections
  const priorityOrder = [
    "experience", "work experience", "professional experience", "employment",
    "skills", "technical skills", "core competencies",
    "summary", "professional summary", "objective", "profile",
    "education", "academic background",
    "projects", "key projects",
    "certifications",
    "header",
  ];

  const parts: string[] = [];
  let totalLength = 0;

  for (const sectionName of priorityOrder) {
    const content = sections.get(sectionName);
    if (!content) continue;

    const sectionStr = `[${sectionName.toUpperCase()}]\n${content}\n`;
    if (totalLength + sectionStr.length > maxLength) {
      // Add what we can
      const remaining = maxLength - totalLength;
      if (remaining > 100) {
        parts.push(`[${sectionName.toUpperCase()}]\n${smartTruncate(content, remaining - 50)}\n`);
      }
      break;
    }
    parts.push(sectionStr);
    totalLength += sectionStr.length;
  }

  // If no sections were extracted, fall back to raw truncation
  if (parts.length === 0) {
    return smartTruncate(rawText, maxLength);
  }

  return parts.join("\n");
}
