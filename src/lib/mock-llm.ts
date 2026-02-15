import type { CandidateProfile, JobProfile } from "./types";
import type { ProOutput } from "./schema";
import { classifyJobFamily, getStrategy, analyzeBullet, familyToStrategyKey } from "./domain";
import type { RewriteStrategy, JobFamily } from "./domain";

/**
 * Mock LLM generator - produces realistic Pro results without calling any API.
 * Used when MOCK_LLM=true or ANTHROPIC_API_KEY is not set.
 *
 * Uses domain classification + strategy pattern to generate profession-appropriate
 * output across all job families (engineering, sales, marketing, finance, ops, etc.).
 */
export function generateMockProResult(
  candidate: CandidateProfile,
  job: JobProfile,
  _resumeText: string
): ProOutput {
  // Classify the job family and get the appropriate strategy
  const { family } = classifyJobFamily(candidate, job);
  const strategy = getStrategy(family);

  const candidateName = candidate.name || "the candidate";
  const jobTitle = job.title || "the target role";
  const company = job.company || "the company";

  const bulletRewrites = generateBulletRewrites(candidate, strategy);
  const keywordChecklist = generateKeywordChecklist(candidate, job);
  const experienceGaps = generateExperienceGaps(candidate, job);
  const coverLetter = generateCoverLetter(candidate, job, family, strategy);
  const tailoredResume = generateTailoredResume(candidate, job, family, strategy);
  const recruiterFeedback = generateRecruiterFeedback(candidate, job);
  const nextActions = generateNextActions(candidate, job);

  const summary = `${candidateName}'s resume shows solid experience but needs optimization for the ${jobTitle} role at ${company}. Key gaps include missing skills from the job description and insufficient quantified impact in bullet points. The tailored version addresses these by rewriting bullets with stronger action verbs, adding missing keywords, and restructuring the skills section to match the job requirements.`;

  // Generate radar scores
  const skillsMatch = Math.min(100, Math.round(40 + candidate.skills.length * 3));
  const experienceAlignment = Math.min(100, Math.round(30 + candidate.experience.length * 15));
  const impactStrength = Math.min(100, Math.round(25 + candidate.experience.flatMap(e => e.bullets).filter(b => /\d/.test(b)).length * 8));
  const atsReadiness = Math.min(100, Math.round(35 + keywordChecklist.filter(k => k.found).length * 4));
  const overall = Math.round(skillsMatch * 0.3 + experienceAlignment * 0.3 + impactStrength * 0.25 + atsReadiness * 0.15);

  // Before/after preview
  const firstBullet = candidate.experience[0]?.bullets[0] || "Worked on various projects";
  const rewrittenFirst = bulletRewrites[0]?.rewritten;
  const beforeAfterPreview = {
    before: firstBullet,
    after: rewrittenFirst || strategy.rewriteBullet(firstBullet, analyzeBullet(firstBullet)),
  };

  // Interview talking points (profession-agnostic)
  const interviewTalkingPoints = buildInterviewTalkingPoints(candidate, job);

  return {
    summary,
    tailoredResume,
    coverLetter,
    keywordChecklist,
    recruiterFeedback,
    bulletRewrites,
    experienceGaps,
    nextActions,
    radar: { overall, skillsMatch, experienceAlignment, impactStrength, atsReadiness },
    beforeAfterPreview,
    interviewTalkingPoints,
  };
}

function generateBulletRewrites(
  candidate: CandidateProfile,
  strategy: RewriteStrategy,
): ProOutput["bulletRewrites"] {
  const rewrites: ProOutput["bulletRewrites"] = [];

  for (const exp of candidate.experience) {
    const section = `${exp.title || ""} at ${exp.company || ""}`.trim();

    for (const bullet of exp.bullets) {
      const signals = analyzeBullet(bullet);
      const rewritten = strategy.rewriteBullet(bullet, signals);
      if (rewritten !== bullet) {
        rewrites.push({
          original: bullet,
          rewritten,
          section: section || "Experience",
          notes: generateRewriteNotes(bullet, rewritten),
        });
      }
    }
  }

  if (rewrites.length < 5 && candidate.experience.length > 0) {
    for (const exp of candidate.experience) {
      if (rewrites.length >= 12) break;
      for (const bullet of exp.bullets) {
        if (rewrites.length >= 12) break;
        if (!rewrites.find((r) => r.original === bullet)) {
          rewrites.push({
            original: bullet,
            rewritten: enhanceBullet(bullet),
            section: `${exp.title || ""} at ${exp.company || ""}`.trim() || "Experience",
            notes: "Enhanced with stronger action verbs and impact metrics",
          });
        }
      }
    }
  }

  return rewrites.slice(0, 20);
}

function enhanceBullet(bullet: string): string {
  let enhanced = bullet;

  // Capitalize first letter
  if (/^[a-z]/.test(enhanced)) {
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
  }

  // Ensure bullet ends with a period (complete sentence)
  if (!/[.!?]$/.test(enhanced.trim())) {
    enhanced = enhanced.trim() + ".";
  }

  return enhanced;
}

function generateRewriteNotes(original: string, rewritten: string): string {
  const notes: string[] = [];

  if (/^(Responsible|Helped|Assisted|Worked|Participated|Involved)/i.test(original)) {
    notes.push("Replaced weak opening with a strong action verb");
  }
  if (!/\d/.test(original) && /\d/.test(rewritten)) {
    notes.push("Added quantifiable impact metric");
  }
  if (rewritten.length > original.length + 20) {
    notes.push("Expanded with scope and results context");
  }
  if (notes.length === 0) {
    notes.push("Strengthened language for more impactful presentation");
  }

  return notes.join(". ") + ".";
}

function generateKeywordChecklist(
  candidate: CandidateProfile,
  job: JobProfile
): ProOutput["keywordChecklist"] {
  const candidateText = [
    ...candidate.skills,
    ...candidate.experience.flatMap((e) => [e.title || "", ...e.bullets]),
  ].join(" ").toLowerCase();

  const checklist: ProOutput["keywordChecklist"] = [];

  for (const keyword of job.keywords) {
    const found = candidateText.includes(keyword.toLowerCase());
    checklist.push({
      keyword,
      found,
      section: found ? "Skills / Experience" : undefined,
      suggestion: found ? undefined : `Add "${keyword}" to your Skills section or incorporate into an experience bullet`,
    });
  }

  for (const req of [...job.requiredSkills, ...job.preferredSkills]) {
    const words = req.match(/\b[A-Z][a-z]+(?:\.\w+)?|[A-Z]{2,}\b/g) || [];
    for (const word of words) {
      if (!checklist.find((c) => c.keyword.toLowerCase() === word.toLowerCase())) {
        const found = candidateText.includes(word.toLowerCase());
        checklist.push({
          keyword: word,
          found,
          suggestion: found ? undefined : `Consider adding "${word}" to demonstrate this competency`,
        });
      }
    }
  }

  return checklist.slice(0, 30);
}

function generateExperienceGaps(
  candidate: CandidateProfile,
  job: JobProfile
): ProOutput["experienceGaps"] {
  const gaps: ProOutput["experienceGaps"] = [];

  const candidateText = [
    ...candidate.skills,
    ...candidate.experience.flatMap((e) => e.bullets),
  ].join(" ").toLowerCase();

  for (const req of job.requiredSkills.slice(0, 8)) {
    const keyTerms = req.match(/\b[A-Z][a-z]+(?:\.\w+)?|[A-Z]{2,}\b/g) || [];
    const found = keyTerms.some((t) => candidateText.includes(t.toLowerCase()));

    if (!found) {
      gaps.push({
        gap: `Requirement not demonstrated: "${req.slice(0, 100)}"`,
        suggestion: `If you have experience with this, add a specific bullet demonstrating it. If not, consider gaining this skill and mentioning willingness to learn in your cover letter.`,
        severity: "high",
      });
    }
  }

  for (const req of job.preferredSkills.slice(0, 5)) {
    const keyTerms = req.match(/\b[A-Z][a-z]+(?:\.\w+)?|[A-Z]{2,}\b/g) || [];
    const found = keyTerms.some((t) => candidateText.includes(t.toLowerCase()));

    if (!found) {
      gaps.push({
        gap: `Nice-to-have not demonstrated: "${req.slice(0, 100)}"`,
        suggestion: `This is a differentiator. If you have any related experience, include it to stand out from other candidates.`,
        severity: "medium",
      });
    }
  }

  return gaps.slice(0, 10);
}

function generateCoverLetter(
  candidate: CandidateProfile,
  job: JobProfile,
  family: JobFamily,
  strategy: RewriteStrategy,
): ProOutput["coverLetter"] {
  const name = candidate.name || "the candidate";
  const title = job.title || "the open position";
  const company = job.company || "the company";
  const topSkills = candidate.skills.slice(0, 5).join(", ");
  const experience = candidate.experience[0];
  const recentRole = experience ? `${experience.title || "my current role"} at ${experience.company || "my current company"}` : "my recent experience";
  const topBullet = experience?.bullets[0] || "delivering high-impact projects";
  const years = candidate.experience.length > 0 ? Math.max(candidate.experience.length * 2, 3) : 3;

  return {
    paragraphs: strategy.draftCoverLetter({
      name,
      title,
      company,
      topSkills,
      recentRole,
      topBullet,
      years,
      responsibilities: job.responsibilities,
      family,
    }),
  };
}

function generateTailoredResume(
  candidate: CandidateProfile,
  job: JobProfile,
  family: JobFamily,
  strategy: RewriteStrategy,
): ProOutput["tailoredResume"] {
  const name = candidate.name || "Your Name";
  // Use candidate's existing headline if it matches the target role; otherwise blend
  const headline = candidate.headline && candidate.headline.length > 3
    ? candidate.headline
    : job.title || "Professional";
  const years = estimateYears(candidate);

  // Build structured skills (profession-aware)
  const skills = buildSkillGroups(candidate, job, strategy);

  // Build structured experience — preserve ALL original bullets and add extras
  const experience = candidate.experience.map((exp) => {
    const improved = exp.bullets.map((b) => {
      const signals = analyzeBullet(b);
      return strategy.rewriteBullet(b, signals);
    });
    // Add supplementary bullets only if needed to reach minimum of 3
    if (improved.length < 3) {
      const role = exp.title || job.title || "the role";
      const extras = [
        `Contributed to key decisions that improved team outcomes and operational efficiency.`,
        `Collaborated with cross-functional team members to maintain quality standards for ${role} deliverables.`,
        `Delivered results on schedule through structured planning and clear documentation.`,
      ];
      for (const extra of extras) {
        if (improved.length >= Math.max(3, exp.bullets.length)) break;
        improved.push(extra);
      }
    }
    return {
      company: exp.company || "",
      title: exp.title || "",
      period: exp.start ? `${exp.start} – ${exp.end || "Present"}` : "",
      bullets: improved,
    };
  });

  // Build structured education
  const education = candidate.education.map((edu) => ({
    school: edu.school || "University",
    degree: edu.degree || "Degree",
    year: edu.end,
  }));

  const summary = strategy.draftSummary({
    headline,
    years,
    skills: candidate.skills,
    jobTitle: job.title || "the target role",
    company: job.company || "your organization",
    family,
  });

  // Pass through projects from the parsed resume
  const projects = candidate.projects.length > 0
    ? candidate.projects.map((p) => ({
        name: p.name || "Project",
        bullets: p.bullets,
      }))
    : undefined;

  return {
    name,
    headline,
    summary,
    skills,
    experience,
    education,
    projects,
    email: candidate.email || undefined,
    phone: candidate.phone || undefined,
    location: candidate.location || undefined,
  };
}

/**
 * Generic skill grouper — groups skills by JD relevance with
 * profession-appropriate category labels.
 */
function buildSkillGroups(
  candidate: CandidateProfile,
  job: JobProfile,
  strategy: RewriteStrategy,
): Array<{ category: string; items: string[] }> {
  // Collect unique skills: candidate skills + JD keywords (no invented skills)
  const allSkills = [...new Set([...candidate.skills, ...job.keywords.filter((k) => k.length < 25)])];

  // Split into JD-aligned vs other
  const jdTerms = new Set([
    ...job.requiredSkills.map((s) => s.toLowerCase()),
    ...job.preferredSkills.map((s) => s.toLowerCase()),
    ...job.keywords.map((s) => s.toLowerCase()),
  ]);

  const core: string[] = [];
  const additional: string[] = [];

  for (const skill of allSkills) {
    if (jdTerms.has(skill.toLowerCase())) {
      core.push(skill);
    } else {
      additional.push(skill);
    }
  }

  // Family-appropriate labels
  const labelMap: Record<string, { core: string; additional: string }> = {
    engineering: { core: "Technical Skills", additional: "Tools & Methods" },
    business: { core: "Core Competencies", additional: "Additional Skills" },
    sales: { core: "Sales & Revenue Skills", additional: "Business Tools" },
    marketing: { core: "Marketing Skills", additional: "Tools & Platforms" },
    finance: { core: "Financial Skills", additional: "Tools & Compliance" },
  };

  const key = familyToStrategyKey(strategy.family);
  const labels = labelMap[key] || labelMap.business;

  const groups: Array<{ category: string; items: string[] }> = [];
  if (core.length > 0) groups.push({ category: labels.core, items: core });
  if (additional.length > 0) groups.push({ category: labels.additional, items: additional });

  // Fallback if no categorization happened
  if (groups.length === 0 && allSkills.length > 0) {
    groups.push({ category: "Skills", items: allSkills });
  }

  return groups;
}

/**
 * Build profession-agnostic interview talking points.
 */
function buildInterviewTalkingPoints(candidate: CandidateProfile, job: JobProfile): string[] {
  const topSkills = candidate.skills.slice(0, 2).join(" and ");
  const jobTitle = job.title || "the role";

  return [
    topSkills
      ? `Discuss your experience with ${topSkills} and how it applies to ${jobTitle}`
      : `Prepare examples of your most relevant experience for ${jobTitle}`,
    `Prepare a walkthrough of a challenging project where you delivered measurable results`,
    candidate.experience.length > 1
      ? `Highlight your career progression from ${candidate.experience[candidate.experience.length - 1]?.title || "early roles"} to ${candidate.experience[0]?.title || "current role"}`
      : "Describe a challenge you solved and the tradeoffs involved",
    `Have a story ready about collaborating with others to achieve a goal`,
  ];
}

function generateRecruiterFeedback(candidate: CandidateProfile, job: JobProfile): string[] {
  const name = candidate.name || "This candidate";
  const years = estimateYears(candidate);
  const title = job.title || "this role";

  return [
    `Recruiter Assessment for ${title}`,
    `Overall Fit: ${years >= 5 ? "Strong" : years >= 3 ? "Moderate" : "Developing"} candidate with relevant foundation.`,
    `${years}+ years of progressive experience showing career growth`,
    `${candidate.skills.length > 5 ? "Diverse" : "Focused"} skill set with ${candidate.skills.slice(0, 3).join(", ")}`,
    candidate.experience.flatMap((e) => e.bullets).filter((b) => /\d/.test(b)).length > 0
      ? "Good use of metrics in experience bullets"
      : "Experience bullets show clear responsibilities",
    "Some key skills from the job requirements are not reflected in the resume",
    "Could benefit from more quantifiable achievements and scope indicators",
    candidate.summary
      ? "Summary could be more targeted to this specific role"
      : "Missing a professional summary section",
    `${name} should tailor their resume to emphasize ${job.keywords.slice(0, 3).join(", ")} experience and add quantified impact to their bullet points. ${years >= 4 ? "The experience level is appropriate for this role." : "May need to demonstrate depth beyond years of experience."}`,
  ];
}

function generateNextActions(candidate: CandidateProfile, job: JobProfile): string[] {
  const actions: string[] = [];

  if (!candidate.summary) {
    actions.push("Add a professional summary targeting the specific role and company");
  }

  const missingSkills = job.keywords.filter(
    (k) => !candidate.skills.some((s) => s.toLowerCase() === k.toLowerCase())
  );
  if (missingSkills.length > 0) {
    actions.push(`Add missing skills to your resume: ${missingSkills.slice(0, 5).join(", ")}`);
  }

  actions.push("Quantify every bullet point with metrics (scope, volume, percentages, outcomes)");
  actions.push("Reorganize skills section to highlight job-relevant competencies first");
  actions.push("Tailor your most recent role's bullets to mirror the job description language");

  if (job.company) {
    actions.push(`Research ${job.company}'s priorities and culture to customize your cover letter`);
  }

  actions.push("Proofread the final version and have a peer review it before submitting");

  return actions.slice(0, 8);
}

function estimateYears(candidate: CandidateProfile): number {
  if (candidate.experience.length === 0) return 0;
  let min = 9999, max = 0;
  const currentYear = new Date().getFullYear();
  for (const exp of candidate.experience) {
    const start = exp.start?.match(/\d{4}/)?.[0];
    const end = exp.end?.match(/\d{4}/)?.[0] || (/(present|current)/i.test(exp.end || "") ? String(currentYear) : null);
    if (start) min = Math.min(min, parseInt(start));
    if (end) max = Math.max(max, parseInt(end));
  }
  if (min === 9999) return candidate.experience.length * 2;
  return Math.max(1, max - min);
}
