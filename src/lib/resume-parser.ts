import type { CandidateProfile, ExperienceEntry, EducationEntry, ProjectEntry } from "./types";

/**
 * Deterministic resume parser - converts raw resume text into a structured CandidateProfile.
 * Uses heuristic section detection and pattern matching.
 */
export function parseResume(text: string): CandidateProfile {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = detectSections(lines);

  const name = extractName(lines);
  const contactInfo = extractContactInfo(text);
  const headline = extractHeadline(lines, name);
  const summary = extractSection(sections, ["summary", "objective", "profile", "about"]);
  const skills = extractSkills(sections, text);
  const experience = extractExperience(sections);
  const education = extractEducation(sections);
  const projects = extractProjects(sections);

  return {
    name: name || undefined,
    headline: headline || undefined,
    summary: summary || undefined,
    email: contactInfo.email || undefined,
    phone: contactInfo.phone || undefined,
    location: contactInfo.location || undefined,
    skills,
    experience,
    education,
    projects,
  };
}

interface SectionMap {
  [key: string]: string[];
}

function detectSections(lines: string[]): SectionMap {
  const sectionHeaders = [
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "work history",
    "education",
    "skills",
    "technical skills",
    "core competencies",
    "competencies",
    "projects",
    "personal projects",
    "summary",
    "professional summary",
    "objective",
    "career objective",
    "profile",
    "about",
    "certifications",
    "certificates",
    "awards",
    "publications",
    "volunteer",
    "languages",
    "interests",
  ];

  const sections: SectionMap = {};
  let currentSection = "_header";
  sections[currentSection] = [];

  for (const line of lines) {
    if (!line) continue;

    const normalizedLine = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const matchedHeader = sectionHeaders.find(
      (h) => normalizedLine === h || normalizedLine === h + "s"
    );

    if (matchedHeader || isLikelySectionHeader(line, normalizedLine)) {
      currentSection = matchedHeader || normalizedLine;
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
    } else {
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(line);
    }
  }

  return sections;
}

function isLikelySectionHeader(line: string, normalized: string): boolean {
  // All caps short line likely a section header
  if (line === line.toUpperCase() && line.length < 40 && line.length > 2 && /^[A-Z\s&]+$/.test(line)) {
    return true;
  }
  // Ends with colon and is short
  if (line.endsWith(":") && line.length < 35) {
    return true;
  }
  // Common section patterns
  if (/^(#{1,3})\s+/.test(line)) {
    return true;
  }
  return normalized.length < 30 && /^[a-z\s]+$/.test(normalized) && normalized.split(" ").length <= 4;
}

function extractName(lines: string[]): string | null {
  // First non-empty line is usually the name
  for (const line of lines) {
    if (!line) continue;
    // Skip lines that look like emails, URLs, phones
    if (line.includes("@") || line.includes("http") || /^\+?\d[\d\s\-()]{7,}$/.test(line)) continue;
    // Skip lines that are section headers
    if (line.toUpperCase() === line && line.length > 30) continue;
    // Name is typically 2-4 words, all alpha
    const words = line.split(/[\s|,]+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 5) {
      const nameCandidate = words.filter((w) => /^[A-Za-z.\-']+$/.test(w)).join(" ");
      if (nameCandidate.length >= 2) {
        return nameCandidate;
      }
    }
    break;
  }
  return null;
}

function extractContactInfo(text: string): { email?: string; phone?: string; location?: string } {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);

  // Location patterns: "City, ST" or "City, State"
  const locationMatch = text.match(
    /(?:^|\||\n)\s*([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/m
  );

  return {
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    location: locationMatch?.[1]?.trim(),
  };
}

function extractHeadline(lines: string[], name: string | null): string | null {
  // Headline is often the line right after the name, containing title/role
  let foundName = false;
  for (const line of lines) {
    if (!line) continue;
    if (!foundName) {
      if (name && line.includes(name)) {
        foundName = true;
      } else if (!name) {
        foundName = true; // Skip first line
      }
      continue;
    }
    // The line after name, if it contains a title-like pattern
    if (line.includes("|") || line.includes("—") || line.includes("-") || /engineer|developer|manager|designer|analyst|scientist|architect|lead|director|consultant/i.test(line)) {
      if (!line.includes("@") && !line.match(/^\+?\d/)) {
        return line;
      }
    }
    break;
  }
  return null;
}

function extractSection(sections: SectionMap, keys: string[]): string | null {
  for (const key of keys) {
    for (const sectionKey of Object.keys(sections)) {
      if (sectionKey.toLowerCase().includes(key)) {
        const content = sections[sectionKey].join(" ").trim();
        if (content) return content;
      }
    }
  }
  return null;
}

function extractSkills(sections: SectionMap, fullText: string): string[] {
  const skills: Set<string> = new Set();

  // Look for skills section
  const skillKeys = ["skills", "technical skills", "core competencies", "competencies", "technologies"];
  for (const key of skillKeys) {
    for (const sectionKey of Object.keys(sections)) {
      if (sectionKey.toLowerCase().includes(key)) {
        const lines = sections[sectionKey];
        for (const line of lines) {
          // Split by common delimiters
          const items = line.split(/[,|;•·●▪◦]/).map((s) => s.trim()).filter(Boolean);
          for (const item of items) {
            // Clean up bullet markers
            const cleaned = item.replace(/^[-–—*]\s*/, "").trim();
            if (cleaned && cleaned.length < 50 && !cleaned.includes(":")) {
              skills.add(cleaned);
            } else if (cleaned.includes(":")) {
              // "Category: skill1, skill2"
              const afterColon = cleaned.split(":")[1];
              if (afterColon) {
                afterColon.split(/[,|;]/).map((s) => s.trim()).filter(Boolean).forEach((s) => {
                  if (s.length < 50) skills.add(s);
                });
              }
            }
          }
        }
      }
    }
  }

  // If no skills section found, try to extract from full text using common skill patterns
  if (skills.size === 0) {
    const commonSkills = [
      "JavaScript", "TypeScript", "Python", "Java", "C\\+\\+", "C#", "Go", "Rust", "Ruby", "PHP",
      "React", "Angular", "Vue", "Next\\.js", "Node\\.js", "Express", "Django", "Flask", "Spring",
      "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
      "PostgreSQL", "MongoDB", "MySQL", "Redis", "GraphQL", "REST",
      "Git", "CI/CD", "Agile", "Scrum",
      "HTML", "CSS", "Tailwind", "SASS",
      "Machine Learning", "Deep Learning", "NLP",
      "SQL", "NoSQL", "Firebase",
    ];
    for (const skill of commonSkills) {
      const regex = new RegExp(`\\b${skill}\\b`, "i");
      if (regex.test(fullText)) {
        skills.add(skill.replace(/\\\+/g, "+").replace(/\\\./, "."));
      }
    }
  }

  return Array.from(skills);
}

function extractExperience(sections: SectionMap): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const expKeys = ["experience", "work experience", "professional experience", "employment", "work history"];

  let expLines: string[] = [];
  for (const key of expKeys) {
    for (const sectionKey of Object.keys(sections)) {
      if (sectionKey.toLowerCase().includes(key)) {
        expLines = [...expLines, ...sections[sectionKey]];
      }
    }
  }

  if (expLines.length === 0) return entries;

  let currentEntry: ExperienceEntry | null = null;

  for (const line of expLines) {
    if (!line) continue;

    // Check if this is a new position header
    const positionMatch = parsePositionLine(line);
    if (positionMatch) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = positionMatch;
      continue;
    }

    // Check if it's a date line for current entry
    if (currentEntry && !currentEntry.start) {
      const dateMatch = extractDates(line);
      if (dateMatch.start) {
        currentEntry.start = dateMatch.start;
        currentEntry.end = dateMatch.end;
        continue;
      }
    }

    // Otherwise it's a bullet point
    if (currentEntry) {
      const bullet = line.replace(/^[•·●▪◦\-–—*]\s*/, "").trim();
      if (bullet && bullet.length > 5) {
        currentEntry.bullets.push(bullet);
      }
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}

function parsePositionLine(line: string): ExperienceEntry | null {
  // Pattern: "Title — Company (dates)" or "Title at Company" or "Company — Title"
  const patterns = [
    // "Senior Engineer — Acme Corp (2021–Present)"
    /^(.+?)\s*[—–\-|]\s*(.+?)\s*\((.+?)\)$/,
    // "Senior Engineer — Acme Corp, 2021–Present"
    /^(.+?)\s*[—–\-|]\s*(.+?),\s*(\d{4}.*)$/,
    // "Senior Engineer at Acme Corp"
    /^(.+?)\s+at\s+(.+)$/i,
    // "Acme Corp — Senior Engineer"
    /^(.+?)\s*[—–\-|]\s*(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      let title = match[1].trim();
      let company = match[2].trim();
      const dateStr = match[3]?.trim();

      // If company looks like a title and title looks like a company, swap
      if (isLikelyTitle(company) && !isLikelyTitle(title)) {
        [title, company] = [company, title];
      }

      const dates = dateStr ? extractDates(dateStr) : { start: undefined, end: undefined };

      return {
        title: title || undefined,
        company: company || undefined,
        start: dates.start,
        end: dates.end,
        bullets: [],
      };
    }
  }

  // Single line that looks like a position
  if (isLikelyTitle(line) && !line.startsWith("•") && !line.startsWith("-")) {
    const dates = extractDates(line);
    const cleanLine = line.replace(/\(.*?\)/g, "").replace(/\d{4}\s*[–\-]\s*\w+/g, "").trim();
    return {
      title: cleanLine || undefined,
      start: dates.start,
      end: dates.end,
      bullets: [],
    };
  }

  return null;
}

function isLikelyTitle(text: string): boolean {
  const titleWords = /\b(engineer|developer|manager|designer|analyst|scientist|architect|lead|director|consultant|intern|associate|senior|junior|staff|principal|vp|cto|ceo|coordinator|specialist|administrator)\b/i;
  return titleWords.test(text);
}

function extractDates(text: string): { start?: string; end?: string } {
  // "2021–Present", "Jan 2019 - Dec 2021", "2019-2021"
  const datePattern = /(\w+\.?\s*\d{4}|\d{4})\s*[–\-—to]+\s*(\w+\.?\s*\d{4}|\d{4}|[Pp]resent|[Cc]urrent)/;
  const match = text.match(datePattern);
  if (match) {
    return { start: match[1].trim(), end: match[2].trim() };
  }

  // Just a year
  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) {
    return { start: yearMatch[1] };
  }

  return {};
}

function extractEducation(sections: SectionMap): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const eduKeys = ["education"];

  let eduLines: string[] = [];
  for (const key of eduKeys) {
    for (const sectionKey of Object.keys(sections)) {
      if (sectionKey.toLowerCase().includes(key)) {
        eduLines = [...eduLines, ...sections[sectionKey]];
      }
    }
  }

  if (eduLines.length === 0) return entries;

  for (const line of eduLines) {
    if (!line) continue;

    const degreePatterns = [
      /\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA|Bachelor|Master|Doctor|Associate)\b/i,
    ];

    const hasDegree = degreePatterns.some((p) => p.test(line));

    if (hasDegree || /university|college|institute|school/i.test(line)) {
      const dates = extractDates(line);
      const degreeMatch = line.match(/(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA|Bachelor'?s?|Master'?s?|Doctor\w*|Associate'?s?)\s*(of|in)?\s*(\w[\w\s]*?)(?:\s*[—–\-,]|\s*\d{4}|$)/i);

      let school: string | undefined;
      let degree: string | undefined;

      if (degreeMatch) {
        degree = degreeMatch[0].replace(/\s*[—–\-,]\s*$/, "").replace(/\s*\d{4}.*$/, "").trim();
      }

      // Extract school name
      const schoolMatch = line.match(/(?:at|from|[—–\-,])\s*([A-Z][\w\s]+?)(?:\s*[,.]|\s*\d{4}|$)/);
      if (schoolMatch) {
        school = schoolMatch[1].trim();
      } else if (!hasDegree) {
        school = line.replace(/\d{4}.*$/, "").replace(/[,].*$/, "").trim();
      }

      entries.push({
        school,
        degree,
        start: dates.start,
        end: dates.end,
      });
    }
  }

  return entries;
}

function extractProjects(sections: SectionMap): ProjectEntry[] {
  const entries: ProjectEntry[] = [];
  const projectKeys = ["projects", "personal projects"];

  let projLines: string[] = [];
  for (const key of projectKeys) {
    for (const sectionKey of Object.keys(sections)) {
      if (sectionKey.toLowerCase().includes(key)) {
        projLines = [...projLines, ...sections[sectionKey]];
      }
    }
  }

  if (projLines.length === 0) return entries;

  let currentProject: ProjectEntry | null = null;

  for (const line of projLines) {
    if (!line) continue;

    const isBullet = /^[•·●▪◦\-–—*]/.test(line);

    if (!isBullet && line.length < 80) {
      if (currentProject) entries.push(currentProject);
      currentProject = { name: line.replace(/[—–\-|].*$/, "").trim(), bullets: [] };
    } else if (currentProject) {
      const bullet = line.replace(/^[•·●▪◦\-–—*]\s*/, "").trim();
      if (bullet) currentProject.bullets.push(bullet);
    }
  }

  if (currentProject) entries.push(currentProject);
  return entries;
}
