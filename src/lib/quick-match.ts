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

/** Split text into lowercase tokens on whitespace/punctuation */
const TOKEN_RE = /[\s,;:.!?()\[\]{}|/\\""''`~@#$%^&*+=<>]+/;

function tokenize(text: string): string[] {
  return text.toLowerCase().split(TOKEN_RE).filter((w) => w.length >= 2);
}

/**
 * Quick keyword-overlap score (0-100).
 * Uses Set-based word lookup for true word-boundary matching
 * ("java" will NOT match "javascript") plus bigram phrase matching
 * for compound skills like "machine learning".
 */
export function quickMatchScore(
  resumeText: string,
  jobDescription: string,
): number {
  if (!resumeText || !jobDescription) return 0;

  // Build a Set of individual resume words → O(1) lookup
  const resumeTokens = tokenize(resumeText);
  const resumeWordSet = new Set(resumeTokens);

  // Build a Set of resume bigrams for phrase matching
  const resumeBigramSet = new Set<string>();
  for (let i = 0; i < resumeTokens.length - 1; i++) {
    resumeBigramSet.add(resumeTokens[i] + " " + resumeTokens[i + 1]);
  }

  // Extract unique JD words (skip stop words and very short tokens)
  const jdTokens = tokenize(jobDescription);
  const jdWords = jdTokens.filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  const uniqueJdWords = [...new Set(jdWords)];
  if (uniqueJdWords.length === 0) return 50;

  // Word-level matching
  let wordMatched = 0;
  for (const word of uniqueJdWords) {
    if (resumeWordSet.has(word)) wordMatched++;
  }
  const wordScore = wordMatched / uniqueJdWords.length;

  // Bigram (phrase) matching for compound skills
  const jdBigrams: string[] = [];
  for (let i = 0; i < jdTokens.length - 1; i++) {
    const a = jdTokens[i], b = jdTokens[i + 1];
    if (a.length >= 3 && b.length >= 3 && !STOP_WORDS.has(a) && !STOP_WORDS.has(b)) {
      jdBigrams.push(a + " " + b);
    }
  }
  const uniqueJdBigrams = [...new Set(jdBigrams)];

  let phraseScore = wordScore; // fallback if no bigrams
  if (uniqueJdBigrams.length > 0) {
    let phraseMatched = 0;
    for (const bigram of uniqueJdBigrams) {
      if (resumeBigramSet.has(bigram)) phraseMatched++;
    }
    phraseScore = phraseMatched / uniqueJdBigrams.length;
  }

  // Blend: 80% word score + 20% phrase score
  const blended = wordScore * 0.8 + phraseScore * 0.2;
  return Math.round(blended * 100);
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
