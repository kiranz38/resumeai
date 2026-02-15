/**
 * Lightweight client-side match scorer for Job Board ranking.
 * Computes keyword overlap between resume text and a job description.
 * NOT a substitute for the full Radar Score — just for sorting/display.
 */

const STOP_WORDS = new Set([
  // Common English
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "has", "have", "been", "will", "with",
  "this", "that", "from", "they", "were", "your", "what", "when", "make",
  "like", "long", "look", "many", "some", "them", "than", "each", "which",
  "about", "would", "there", "their", "other", "could", "after", "should",
  "also", "just", "into", "over", "such", "where", "most", "more", "very",
  "well", "back", "only", "come", "its", "even", "new", "want", "because",
  "any", "these", "give", "day", "good", "how", "him", "own", "then",
  // Job-posting filler
  "work", "experience", "ability", "including", "strong", "required",
  "preferred", "minimum", "years", "team", "role", "position", "company",
  "must", "skills", "knowledge", "working", "responsibilities",
  "qualifications", "requirements", "join", "looking", "opportunity",
  "equal", "employer", "apply", "please", "candidate", "ideal", "offer",
  "competitive", "benefits", "salary", "description", "job", "full",
  "time", "part", "based", "may", "per", "etc", "able", "across",
  "ensure", "support", "using", "need", "provide", "help", "within",
]);

/** Threshold below which we show the low-match permission dialog */
export const LOW_MATCH_THRESHOLD = 25;

/**
 * Quick keyword-overlap score (0-100).
 * Extracts significant words from the JD and checks how many
 * appear anywhere in the resume text.
 */
export function quickMatchScore(
  resumeText: string,
  jobDescription: string,
): number {
  if (!resumeText || !jobDescription) return 0;

  const resumeLower = resumeText.toLowerCase();

  const jdWords = jobDescription
    .toLowerCase()
    .split(/[\s,;:.!?()\[\]{}|/\\""''`~@#$%^&*+=<>]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const uniqueJdWords = [...new Set(jdWords)];
  if (uniqueJdWords.length === 0) return 50;

  let matched = 0;
  for (const word of uniqueJdWords) {
    if (resumeLower.includes(word)) matched++;
  }

  return Math.round((matched / uniqueJdWords.length) * 100);
}

/**
 * UI display helpers for match score badges.
 */
export function matchScoreDisplay(score: number): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  if (score >= 70)
    return { label: "Strong", colorClass: "text-green-700", bgClass: "bg-green-100" };
  if (score >= 45)
    return { label: "Good", colorClass: "text-blue-700", bgClass: "bg-blue-100" };
  if (score >= 25)
    return { label: "Fair", colorClass: "text-amber-700", bgClass: "bg-amber-100" };
  return { label: "Low", colorClass: "text-red-700", bgClass: "bg-red-100" };
}
