import type { CandidateProfile, JobProfile } from "./types";
import type { ProOutput } from "./schema";

/**
 * Mock LLM generator - produces realistic Pro results without calling any API.
 * Used when MOCK_LLM=true or ANTHROPIC_API_KEY is not set.
 */
export function generateMockProResult(
  candidate: CandidateProfile,
  job: JobProfile,
  _resumeText: string
): ProOutput {
  const candidateName = candidate.name || "the candidate";
  const jobTitle = job.title || "the target role";
  const company = job.company || "the company";

  const bulletRewrites = generateBulletRewrites(candidate);
  const keywordChecklist = generateKeywordChecklist(candidate, job);
  const experienceGaps = generateExperienceGaps(candidate, job);
  const coverLetter = generateCoverLetter(candidate, job);
  const tailoredResume = generateTailoredResume(candidate, job);
  const recruiterFeedback = generateRecruiterFeedback(candidate, job);
  const nextActions = generateNextActions(candidate, job);

  const summary = `${candidateName}'s resume shows solid experience but needs optimization for the ${jobTitle} role at ${company}. Key gaps include missing technologies and insufficient system-level impact in bullet points. The tailored version addresses these by rewriting bullets with stronger metrics, adding missing keywords, and restructuring the skills section to match the job requirements. Focus areas: add missing tech skills, quantify impact, and lead with architecture-level accomplishments.`;

  // Generate radar scores
  const skillsMatch = Math.min(100, Math.round(40 + candidate.skills.length * 3));
  const experienceAlignment = Math.min(100, Math.round(30 + candidate.experience.length * 15));
  const impactStrength = Math.min(100, Math.round(25 + candidate.experience.flatMap(e => e.bullets).filter(b => /\d/.test(b)).length * 8));
  const atsReadiness = Math.min(100, Math.round(35 + keywordChecklist.filter(k => k.found).length * 4));
  const overall = Math.round(skillsMatch * 0.3 + experienceAlignment * 0.3 + impactStrength * 0.25 + atsReadiness * 0.15);

  // Before/after preview
  const firstBullet = candidate.experience[0]?.bullets[0] || "Worked on various projects";
  const beforeAfterPreview = {
    before: firstBullet,
    after: bulletRewrites[0]?.rewritten || `Architected and delivered scalable solutions for ${jobTitle}, driving measurable improvements in system reliability`,
  };

  // Interview talking points
  const interviewTalkingPoints = [
    `Discuss your experience with ${candidate.skills.slice(0, 2).join(" and ")} in a production environment`,
    `Prepare a system design walkthrough for a project similar to ${jobTitle}`,
    candidate.experience.length > 1
      ? `Highlight your career progression from ${candidate.experience[candidate.experience.length - 1]?.title || "early roles"} to ${candidate.experience[0]?.title || "current role"}`
      : "Describe a technical challenge you solved and the tradeoffs involved",
    `Have a performance optimization story ready with specific metrics`,
  ];

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

function generateBulletRewrites(candidate: CandidateProfile): ProOutput["bulletRewrites"] {
  const rewrites: ProOutput["bulletRewrites"] = [];

  for (const exp of candidate.experience) {
    const section = `${exp.title || ""} at ${exp.company || ""}`.trim();

    for (const bullet of exp.bullets) {
      const rewritten = rewriteBullet(bullet);
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

function rewriteBullet(bullet: string): string {
  let improved = bullet;

  const replacements: [RegExp, string][] = [
    [/^Responsible for\s+/i, "Spearheaded "],
    [/^Helped\s+/i, "Collaborated to "],
    [/^Assisted\s+(with\s+)?/i, "Supported "],
    [/^Worked on\s+/i, "Developed and delivered "],
    [/^Participated in\s+/i, "Contributed to "],
    [/^Involved in\s+/i, "Drove "],
    [/^Was part of\s+/i, "Collaborated across teams on "],
    [/^Created\s+/i, "Designed and implemented "],
    [/^Built\s+/i, "Architected and built "],
    [/^Made\s+/i, "Engineered "],
    [/^Managed\s+/i, "Led and managed "],
    [/^Used\s+/i, "Leveraged "],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(improved)) {
      improved = improved.replace(pattern, replacement);
      break;
    }
  }

  if (!/\d/.test(improved)) {
    improved = improved.replace(/\.$/, "");
    if (improved.length < 120) {
      improved += ", resulting in measurable performance improvements";
    }
  }

  return improved;
}

function enhanceBullet(bullet: string): string {
  let enhanced = bullet;

  if (/^[a-z]/.test(enhanced)) {
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
  }

  if (!enhanced.includes("team") && !enhanced.includes("cross-functional")) {
    enhanced = enhanced.replace(/\.$/, "") + " in cross-functional collaboration with stakeholders";
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

function generateCoverLetter(candidate: CandidateProfile, job: JobProfile): ProOutput["coverLetter"] {
  const name = candidate.name || "the candidate";
  const title = job.title || "the open position";
  const company = job.company || "the company";
  const topSkills = candidate.skills.slice(0, 5).join(", ");
  const experience = candidate.experience[0];
  const recentRole = experience ? `${experience.title || "my current role"} at ${experience.company || "my current company"}` : "my recent experience";
  const topBullet = experience?.bullets[0] || "delivering high-impact projects";
  const years = candidate.experience.length > 0 ? Math.max(candidate.experience.length * 2, 3) : 3;

  return {
    paragraphs: [
      "Dear Hiring Manager,",
      `I am writing to express my strong interest in the ${title} position at ${company}. With ${years}+ years of experience in software development and a background in ${topSkills}, I am confident in my ability to contribute meaningfully to your team.`,
      `In ${recentRole}, I have ${topBullet.charAt(0).toLowerCase()}${topBullet.slice(1).replace(/\.$/, "")}. This experience has given me a solid foundation in building scalable solutions and collaborating with cross-functional teams to deliver results.`,
      `What excites me most about this opportunity is the chance to apply my skills to ${company}'s mission. ${job.responsibilities.length > 0 ? `I am particularly drawn to the focus on ${job.responsibilities[0].toLowerCase().replace(/\.$/, "")}.` : "I am eager to contribute to meaningful technical challenges and grow alongside talented engineers."}`,
      `I would welcome the opportunity to discuss how my experience and skills align with your team's needs. I am excited about the possibility of contributing to ${company} and would be glad to share more details about my background.`,
      `Best regards,\n${name}`,
    ],
  };
}

function generateTailoredResume(
  candidate: CandidateProfile,
  job: JobProfile
): ProOutput["tailoredResume"] {
  const name = candidate.name || "Your Name";
  const headline = job.title || candidate.headline || "Software Engineer";
  const years = estimateYears(candidate);

  // Build structured skills
  const skills = buildSkillGroups(candidate, job);

  // Build structured experience — preserve ALL original bullets and add extras
  const experience = candidate.experience.map((exp) => {
    const improved = exp.bullets.map((b) => rewriteBullet(b));
    // Add supplementary bullets to match or exceed original content length
    if (improved.length < 4) {
      const extras = [
        `Collaborated with cross-functional teams to deliver key initiatives on schedule`,
        `Drove continuous improvement through code reviews, documentation, and mentoring`,
        `Contributed to system architecture decisions impacting scalability and reliability`,
        `Participated in agile ceremonies and sprint planning to align priorities`,
      ];
      for (const extra of extras) {
        if (improved.length >= Math.max(4, exp.bullets.length)) break;
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

  const summary = `Results-driven ${headline} with ${years > 0 ? years + "+" : "N"} years of experience building scalable applications and leading technical initiatives. Skilled in ${candidate.skills.slice(0, 5).join(", ")}. Seeking to leverage expertise in ${job.keywords.slice(0, 3).join(", ")} to drive impact as ${job.title || "an engineer"} at ${job.company || "your organization"}.`;

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

function buildSkillGroups(
  candidate: CandidateProfile,
  job: JobProfile
): Array<{ category: string; items: string[] }> {
  const categories: Record<string, string[]> = {
    "Languages": [],
    "Frontend": [],
    "Backend": [],
    "Cloud & DevOps": [],
    "Databases": [],
    "Tools & Methods": [],
  };

  const allSkills = [...new Set([...candidate.skills, ...job.keywords.filter((k) => k.length < 25)])];

  for (const skill of allSkills) {
    const lower = skill.toLowerCase();
    if (/^(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin|scala|r|sql)$/i.test(lower)) {
      categories["Languages"].push(skill);
    } else if (/^(react|angular|vue|svelte|next|nuxt|html|css|tailwind|sass|bootstrap)$/i.test(lower)) {
      categories["Frontend"].push(skill);
    } else if (/^(node|express|django|flask|spring|rails|laravel|graphql|rest|grpc)$/i.test(lower)) {
      categories["Backend"].push(skill);
    } else if (/^(aws|gcp|azure|docker|kubernetes|terraform|ci|github|jenkins|linux|bash)$/i.test(lower)) {
      categories["Cloud & DevOps"].push(skill);
    } else if (/^(postgresql|mysql|mongodb|redis|elasticsearch|dynamodb|cassandra|sqlite|nosql)$/i.test(lower)) {
      categories["Databases"].push(skill);
    } else {
      categories["Tools & Methods"].push(skill);
    }
  }

  return Object.entries(categories)
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => ({ category, items }));
}

function generateRecruiterFeedback(candidate: CandidateProfile, job: JobProfile): string[] {
  const name = candidate.name || "This candidate";
  const years = estimateYears(candidate);
  const title = job.title || "this role";

  return [
    `Recruiter Assessment for ${title}`,
    `Overall Fit: ${years >= 5 ? "Strong" : years >= 3 ? "Moderate" : "Developing"} candidate with relevant foundation.`,
    `${years}+ years of progressive experience showing career growth`,
    `${candidate.skills.length > 5 ? "Diverse" : "Focused"} technical skill set with ${candidate.skills.slice(0, 3).join(", ")}`,
    candidate.experience.flatMap((e) => e.bullets).filter((b) => /\d/.test(b)).length > 0
      ? "Good use of metrics in experience bullets"
      : "Experience bullets show clear responsibilities",
    "Some key technologies from the job requirements are not reflected in the resume",
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

  const missingTech = job.keywords.filter(
    (k) => !candidate.skills.some((s) => s.toLowerCase() === k.toLowerCase())
  );
  if (missingTech.length > 0) {
    actions.push(`Add missing technical skills to your resume: ${missingTech.slice(0, 5).join(", ")}`);
  }

  actions.push("Quantify every bullet point with metrics (users, revenue, percentage improvements)");
  actions.push("Reorganize skills section by category (Languages, Frontend, Backend, Cloud, etc.)");
  actions.push("Tailor your most recent role's bullets to mirror the job description language");

  if (job.company) {
    actions.push(`Research ${job.company}'s tech stack and culture to customize your cover letter`);
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
