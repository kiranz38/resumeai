"use client";

import type { CandidateProfile, JobProfile } from "@/lib/types";

interface ResumePreviewCardProps {
  candidate: CandidateProfile;
  job: JobProfile;
  improvedBullets: Array<{ original: string; improved: string }>;
  onUpgrade: (plan: "trial" | "pro") => void;
  loading?: boolean;
}

/**
 * Free-tier resume preview — appetite, not the meal.
 * Shows: Name, Headline, Summary, ONE bullet. Then fade + CTA.
 */
export default function ResumePreviewCard({
  candidate,
  job,
  improvedBullets,
  onUpgrade,
  loading,
}: ResumePreviewCardProps) {
  const name = candidate.name || "Your Name";
  const topRole = candidate.experience[0];
  const yearsExp = estimateYears(candidate);

  // Tailored headline from job title
  const headline = job.title || candidate.headline || "Professional";

  // Build contact line
  const contactParts: string[] = [];
  if (candidate.email) contactParts.push(candidate.email);
  if (candidate.phone) contactParts.push(candidate.phone);
  if (candidate.location) contactParts.push(candidate.location);
  if (candidate.links?.length) contactParts.push(candidate.links[0]);

  // Professional summary
  const summary = buildPreviewSummary(candidate, job, yearsExp);

  // ONE improved bullet for top role
  const oneBullet = getFirstImprovedBullet(topRole, improvedBullets);

  return (
    <div className="mb-8">
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Your Tailored Resume</h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">Preview</span>
      </div>

      {/* CV Document */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* ── Visible: Name + Headline + Summary + ONE bullet ── */}
        <div className="px-4 pt-4 sm:px-8 sm:pt-8">
          {/* Name */}
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{name}</h3>

          {/* Headline */}
          <p className="mt-0.5 text-sm font-semibold text-blue-700 tracking-wide">{headline}</p>

          {/* Contact line */}
          {contactParts.length > 0 && (
            <p className="mt-1.5 text-xs text-gray-500">
              {contactParts.join("  ·  ")}
            </p>
          )}

          {/* Divider */}
          <div className="mt-4 border-t border-gray-200" />

          {/* Professional Summary */}
          <div className="mt-4">
            <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Professional Summary</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-700">{summary}</p>
          </div>

          {/* Divider */}
          <div className="mt-4 border-t border-gray-200" />

          {/* Experience — ONE bullet only */}
          <div className="mt-4">
            <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Experience</h4>

            {topRole && (
              <div className="mt-3">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{topRole.title || "Role"}</span>
                    {topRole.company && (
                      <span className="text-sm text-gray-600"> — {topRole.company}</span>
                    )}
                  </div>
                  {(topRole.start || topRole.end) && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {topRole.start}{topRole.start && topRole.end ? " – " : ""}{topRole.end}
                    </span>
                  )}
                </div>
                {/* First bullet + remaining bullets fade out continuously */}
                <ul className="mt-2 space-y-1.5">
                  {(topRole?.bullets || []).slice(0, 4).map((b, i) => {
                    const bullet = i === 0 ? oneBullet || b : b;
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-gray-700"
                        style={{
                          opacity: i === 0 ? 1 : Math.max(0.08, 0.5 - i * 0.2),
                          filter: i === 0 ? "none" : `blur(${Math.min(i * 1.5, 4)}px)`,
                        }}
                        aria-hidden={i > 0 ? "true" : undefined}
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                        {bullet}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Gradient fade-to-white over the trailing bullets */}
        <div className="relative h-6 -mt-6" style={{ background: "linear-gradient(to bottom, transparent, white)" }} />

        {/* CTA — directly after fade, no scrolling needed */}
        <div className="px-4 pb-4 pt-0 sm:px-8 sm:pb-8 sm:pt-1 text-center">
          <p className="text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
            Unlock your full tailored resume, cover letter, and ATS optimization
          </p>
          <p className="text-xs text-gray-400 mb-2.5 sm:mb-4">Includes PDF/DOCX export, keyword checklist, and recruiter insights</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => onUpgrade("trial")}
              disabled={loading === true}
              className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Try for $1.50"}
            </button>
            <button
              onClick={() => onUpgrade("pro")}
              disabled={loading === true}
              className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Get Pro — $5"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Get the first improved bullet for a role, falling back to original */
function getFirstImprovedBullet(
  role: CandidateProfile["experience"][0] | undefined,
  previews: Array<{ original: string; improved: string }>,
): string | null {
  if (!role || role.bullets.length === 0) return null;

  const improvedMap = new Map<string, string>();
  for (const p of previews) {
    improvedMap.set(p.original.trim().toLowerCase(), p.improved);
  }

  const first = role.bullets[0];
  return improvedMap.get(first.trim().toLowerCase()) || first;
}

/** Estimate years of experience from date ranges */
function estimateYears(candidate: CandidateProfile): number {
  const currentYear = new Date().getFullYear();
  let earliest = currentYear;

  for (const exp of candidate.experience) {
    const startMatch = exp.start?.match(/(\d{4})/);
    if (startMatch) {
      const year = parseInt(startMatch[1], 10);
      if (year > 1970 && year < currentYear) {
        earliest = Math.min(earliest, year);
      }
    }
  }

  return earliest < currentYear ? currentYear - earliest : 0;
}

// ATS-approved opening adjectives — rotated based on candidate name hash for variety
const ATS_OPENERS = [
  "Results-driven",
  "Accomplished",
  "Detail-oriented",
  "Performance-focused",
  "Strategic",
  "Versatile",
  "Dedicated",
  "Proactive",
] as const;

/** Build an extensive, JD-oriented professional summary using ATS-approved language */
function buildPreviewSummary(
  candidate: CandidateProfile,
  job: JobProfile,
  years: number,
): string {
  const company = job.company || "";

  // Pick a consistent opener based on candidate name
  const nameHash = (candidate.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const opener = ATS_OPENERS[nameHash % ATS_OPENERS.length];

  // Derive a clean role descriptor — use candidate headline or JD title, never raw
  // Avoid doubling seniority words like "Senior Senior Engineer"
  const rawRole = candidate.headline || job.title || "professional";
  const role = rawRole.replace(/^(senior|lead|principal|staff|junior|mid[- ]?level)\s+/i, "").trim();
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  // Find skills that overlap between candidate and JD (matched skills sell the fit)
  const jdSkillsLower = new Set([
    ...job.requiredSkills.map((s) => s.toLowerCase()),
    ...job.preferredSkills.map((s) => s.toLowerCase()),
    ...job.keywords.map((s) => s.toLowerCase()),
  ]);
  const matchedSkills = candidate.skills.filter((s) =>
    jdSkillsLower.has(s.toLowerCase()) ||
    [...jdSkillsLower].some((jd) => jd.includes(s.toLowerCase()) || s.toLowerCase().includes(jd))
  );
  const topMatched = matchedSkills.slice(0, 6);
  // Fill with JD required skills if not enough matches
  const displaySkills = topMatched.length >= 3
    ? topMatched
    : [...topMatched, ...job.requiredSkills.filter((s) => !topMatched.some((m) => m.toLowerCase() === s.toLowerCase()))].slice(0, 6);

  // Pull best quantified achievement from bullets
  const allBullets = candidate.experience.flatMap((e) => e.bullets);
  const metricBullets = allBullets.filter((b) =>
    /\d+%|\$[\d,]+[KkMm]?|\d+x|reduced|increased|improved|delivered|grew|saved|generated|achieved|optimized|scaled/i.test(b)
  );

  // Pick a JD responsibility to mirror
  const topResponsibility = job.responsibilities[0];

  // ── Compose 4-5 ATS-optimized sentences ──
  const parts: string[] = [];

  // Sentence 1: ATS opener + role + years + core domain skills
  const skillsList = displaySkills.slice(0, 4);
  const skillsPhrase = skillsList.length > 1
    ? `${skillsList.slice(0, -1).join(", ")}, and ${skillsList[skillsList.length - 1]}`
    : skillsList[0] || "cross-functional delivery";

  if (years > 0) {
    parts.push(`${opener} ${roleLabel} with ${years}+ years of progressive experience in ${skillsPhrase}.`);
  } else {
    parts.push(`${opener} ${roleLabel} with demonstrated expertise in ${skillsPhrase}.`);
  }

  // Sentence 2: Quantified achievement (strongest signal for recruiters)
  if (metricBullets.length > 0) {
    const best = metricBullets[0];
    // Clean up bullet for embedding: lowercase start, remove trailing period
    const cleaned = best.replace(/^[•\-–]\s*/, "").trim();
    parts.push(`Track record of delivering measurable outcomes, including ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1).replace(/\.$/, "")}.`);
  } else {
    parts.push("Consistent track record of delivering high-quality outcomes and driving cross-functional initiatives.");
  }

  // Sentence 3: JD responsibility alignment (shows direct fit)
  if (topResponsibility) {
    const cleaned = topResponsibility.replace(/^[•\-–]\s*/, "").trim();
    parts.push(`Adept at ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1).replace(/\.$/, "")}, aligned with organizational goals and stakeholder expectations.`);
  }

  // Sentence 4: Second achievement for experienced candidates (makes summary longer)
  if (years >= 5 && metricBullets.length > 1) {
    const second = metricBullets[1].replace(/^[•\-–]\s*/, "").trim();
    parts.push(`Further demonstrated value by ${second.charAt(0).toLowerCase()}${second.slice(1).replace(/\.$/, "")}.`);
  }

  // Sentence 5: Additional JD-matched skills not yet mentioned
  const mentionedLower = parts.join(" ").toLowerCase();
  const remaining = displaySkills.slice(4).filter((s) => !mentionedLower.includes(s.toLowerCase()));
  if (remaining.length > 0) {
    parts.push(`Core competencies also include ${remaining.join(", ")}, complemented by strong analytical and communication skills.`);
  } else if (job.preferredSkills.length > 0) {
    const bonus = job.preferredSkills.slice(0, 2).filter((s) => !mentionedLower.includes(s.toLowerCase()));
    if (bonus.length > 0) {
      parts.push(`Additional strengths in ${bonus.join(" and ")}, with a collaborative approach to problem-solving.`);
    }
  }

  // Sentence 6: Leadership / team context for experienced candidates
  if (years >= 5) {
    const teamBullet = allBullets.find((b) =>
      /mentor|led\s+a?\s*team|managed\s+\d|cross[- ]functional|collaborated|stakeholder|onboard/i.test(b)
    );
    if (teamBullet) {
      const cleaned = teamBullet.replace(/^[•\-–]\s*/, "").trim();
      parts.push(`Known for ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1).replace(/\.$/, "")}.`);
    } else {
      parts.push("Recognized for strong collaboration across cross-functional teams, with a commitment to mentoring and knowledge sharing.");
    }
  }

  // Sentence 7: Second JD responsibility for senior candidates
  if (years >= 7 && job.responsibilities.length > 1) {
    const second = job.responsibilities[1].replace(/^[•\-–]\s*/, "").trim();
    parts.push(`Skilled in ${second.charAt(0).toLowerCase()}${second.slice(1).replace(/\.$/, "")}, ensuring alignment with industry best practices.`);
  }

  // Final sentence: Company targeting (if available)
  if (company) {
    parts.push(`Eager to bring this expertise to ${company} and contribute to its continued growth.`);
  }

  return parts.join(" ");
}
