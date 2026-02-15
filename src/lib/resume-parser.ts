import type { CandidateProfile, ExperienceEntry, EducationEntry, ProjectEntry } from "./types";

/**
 * Deterministic resume parser - converts raw resume text into a structured CandidateProfile.
 * Uses heuristic section detection and pattern matching.
 */
export function parseResume(text: string): CandidateProfile {
  // Strip [LINKS] section before parsing, but extract hidden links from it
  const { mainText, hiddenLinks } = stripLinksSection(text);

  const lines = mainText.split(/\r?\n/).map((l) => l.trim());
  const sections = detectSections(lines);

  const name = extractName(lines);
  const contactInfo = extractContactInfo(mainText);
  const headline = extractHeadline(lines, name);
  const summary = extractSection(sections, ["summary", "objective", "profile", "about"]);
  const skills = extractSkills(sections, mainText);
  const experience = extractExperience(sections);
  const education = extractEducation(sections);
  const projects = extractProjects(sections);
  const links = extractLinks(mainText, hiddenLinks);

  return {
    name: name || undefined,
    headline: headline || undefined,
    summary: summary || undefined,
    email: contactInfo.email || undefined,
    phone: contactInfo.phone || undefined,
    location: contactInfo.location || undefined,
    links: links.length > 0 ? links : undefined,
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
    "employment history",
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
  // Lines containing years or date-like patterns are never section headers
  if (/\b(19|20)\d{2}\b/.test(line)) return false;
  if (/\b(present|current)\b/i.test(line)) return false;

  // Sub-headings within experience — never top-level sections
  const stripped = line.replace(/[^a-zA-Z\s]/g, "").trim().toLowerCase();
  if (/^roles?\s*(and|&)?\s*responsibilities$/i.test(stripped)) return false;
  if (/^key\s*responsibilities$/i.test(stripped)) return false;

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
  // Short, alpha-only, few words — likely a section header
  // Require <= 3 words, no digits in original, to avoid matching date/content lines
  return normalized.length < 25 && /^[a-z\s]+$/.test(normalized) && normalized.split(" ").length <= 3
    && !/\d/.test(line);
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
  // Location patterns: "City, ST" or "City, State" — only match near the top (first 500 chars)
  const headerArea = text.slice(0, 500);

  // Phone: try patterns in specificity order on header area to avoid false positives
  const phonePatterns = [
    // UK: +44 7700 900000, 07700 900000, +44 (0) 20 7946 0958
    /(?:\+44[\s.-]?(?:\(0\)[\s.-]?)?|0)(?:\d[\s.-]?){9,10}\d/,
    // AU: +61 412 345 678, 0412 345 678, (02) 1234 5678
    /(?:\+61[\s.-]?|0)[2-478](?:[\s.-]?\d){8}/,
    // NZ: +64 21 123 4567, 021 123 4567
    /(?:\+64[\s.-]?|0)[2-9](?:[\s.-]?\d){7,8}/,
    // General international fallback: +<country> then 7-12 digits with optional separators
    /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d){5,9}\d/,
    // US/CA: (555) 123-4567, +1 555-123-4567
    /(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
  ];
  let phoneMatch: RegExpMatchArray | null = null;
  for (const pattern of phonePatterns) {
    phoneMatch = headerArea.match(pattern);
    if (phoneMatch) break;
  }
  const locationMatch = headerArea.match(
    /(?:^|\||\n)\s*([A-Z][a-zA-Z ]+,\s*(?:[A-Z]{2,3}|Australia|NSW|VIC|QLD|SA|WA|TAS|ACT|NT|UK|United Kingdom|England|Scotland|Wales|Northern Ireland|Canada|Ontario|Quebec|British Columbia|Alberta|Manitoba|Saskatchewan|Nova Scotia|New Brunswick|Newfoundland|New Zealand|Ireland)(?:\s+\d{4,5})?)\s*(?:\||$|\n)/m
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

function isFragmentBullet(bullet: string): boolean {
  // Too short to be a meaningful bullet
  if (bullet.length < 20) return true;
  // Ends with a dangling preposition/conjunction/article — clearly truncated
  if (/\s+(and|or|the|a|an|to|of|in|for|with|by|at|from|as|on|into|via)\s*$/i.test(bullet)) return true;
  return false;
}

function extractExperience(sections: SectionMap): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const expKeys = ["experience", "work experience", "professional experience", "employment", "employment history", "work history"];

  let expLines: string[] = [];
  const matchedSections = new Set<string>();
  for (const key of expKeys) {
    for (const sectionKey of Object.keys(sections)) {
      if (sectionKey.toLowerCase().includes(key) && !matchedSections.has(sectionKey)) {
        matchedSections.add(sectionKey);
        expLines = [...expLines, ...sections[sectionKey]];
      }
    }
  }

  // Secondary pass: find position entries scattered in non-experience sections.
  // Multi-column PDFs often interleave sidebar headers (Details, Skills, Hobbies)
  // into the experience text, pushing remaining entries into wrong sections.
  const skipSections = new Set(["education", "certifications", "certificates"]);
  for (const sectionKey of Object.keys(sections)) {
    if (matchedSections.has(sectionKey)) continue;
    if (skipSections.has(sectionKey.toLowerCase())) continue;

    const sectionLines = sections[sectionKey];
    let firstPositionIdx = -1;
    for (let j = 0; j < sectionLines.length; j++) {
      if (parsePositionLine(sectionLines[j])) {
        firstPositionIdx = j;
        break;
      }
    }
    if (firstPositionIdx >= 0) {
      expLines.push(...sectionLines.slice(firstPositionIdx));
    }
  }

  if (expLines.length === 0) return entries;

  // Pre-process: join lines split at connectors by PDF column breaks.
  // e.g. "Senior Engineer at Robert Bosch Engineering and" + "Business Solutions, Bengaluru"
  for (let i = 0; i < expLines.length - 1; i++) {
    if (/\s+(and|or|&)\s*$/i.test(expLines[i]) && expLines[i].length < 120) {
      const next = expLines[i + 1];
      if (!next || next.length < 3) continue;
      // Don't join across entry boundaries (dates, Project/Company labels, bullet markers)
      if (/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b/i.test(next)) continue;
      if (/^(Project|Company|Education|Skills|Experience)\s*:/i.test(next)) continue;
      if (/^[•·●▪◦*]\s/.test(next)) continue;
      expLines[i] = expLines[i].trimEnd() + " " + next.trimStart();
      expLines.splice(i + 1, 1);
      i--; // re-check merged line
    }
  }

  let currentEntry: ExperienceEntry | null = null;
  let pendingProjectName: string | null = null;

  for (const line of expLines) {
    if (!line) continue;

    // Skip sub-heading labels (Roles and responsibilities:, etc.)
    if (/^(roles?\s*(and|&)?\s*responsibilities|key\s*responsibilities)\s*:?\s*$/i.test(line)) continue;

    // "Project:" line — set on current entry or save for next
    if (/^Project:\s*/i.test(line)) {
      const projectName = line.replace(/^Project:\s*/i, "").trim();
      if (currentEntry && !currentEntry.company) {
        currentEntry.company = projectName;
      } else if (!currentEntry) {
        pendingProjectName = projectName;
      }
      // If currentEntry already has a company, project is supplementary context — skip
      continue;
    }

    // Check if this is a new position header
    const positionMatch = parsePositionLine(line);
    if (positionMatch) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = positionMatch;
      pendingProjectName = null;
      continue;
    }

    // "Company:" line — update current entry's company (don't create a new entry)
    if (/^Company:\s*/i.test(line)) {
      const companyName = line.replace(/^Company:\s*/i, "").trim();
      if (currentEntry) {
        currentEntry.company = companyName;
      } else {
        currentEntry = { company: companyName, bullets: [] };
      }
      continue;
    }

    // Standalone date line (starts with month/year, short) — indicates entry boundary
    // Skip bare year numbers that are likely version numbers (e.g., "2008" from "SQL Server 2008")
    // A real date line has a month name or a year range with separator
    const startsWithYear = /^\d{4}\b/.test(line);
    const hasMonthOrRange = /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line) || /\d{4}\s*[–\-—to]+\s*\w/i.test(line);
    const isPureDateLine = (hasMonthOrRange || (startsWithYear && /[–\-—]/.test(line))) && line.length < 60;
    if (isPureDateLine) {
      const dateMatch = extractDates(line);
      if (dateMatch.start) {
        if (currentEntry && !currentEntry.start) {
          currentEntry.start = dateMatch.start;
          currentEntry.end = dateMatch.end;
        } else {
          // Current entry already has dates or no entry → new entry
          if (currentEntry) entries.push(currentEntry);
          // Only use pendingProjectName for the very first entry (before any position header)
          const useProject = entries.length === 0 && !currentEntry && pendingProjectName;
          currentEntry = {
            company: useProject ? pendingProjectName || undefined : undefined,
            start: dateMatch.start,
            end: dateMatch.end,
            bullets: [],
          };
          pendingProjectName = null;
        }
        continue;
      }
    }

    // Bullet point or content line
    const bullet = line.replace(/^[•·●▪◦\-–—*]\s*/, "").trim();
    if (bullet && bullet.length > 5) {
      if (currentEntry) {
        const prevBullet = currentEntry.bullets.length > 0 ? currentEntry.bullets[currentEntry.bullets.length - 1] : null;
        // Detect continuation lines: lowercase start or previous bullet ends with comma
        const isContinuation = prevBullet && (
          (/^[a-z]/.test(bullet) && !/[.!?]\s*$/.test(prevBullet)) ||
          /,\s*$/.test(prevBullet)
        );
        if (isContinuation) {
          // Merge with previous bullet — PDF wrapped the line
          currentEntry.bullets[currentEntry.bullets.length - 1] = prevBullet + " " + bullet;
        } else if (!isFragmentBullet(bullet)) {
          currentEntry.bullets.push(bullet);
        }
      }
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  // Post-process: merge bullet-less entries into adjacent entries when they
  // look like a title line for the previous role (common in multi-column PDFs
  // where the title appears after the bullets).
  for (let i = entries.length - 1; i > 0; i--) {
    const entry = entries[i];
    const prev = entries[i - 1];
    if (entry.bullets.length === 0 && !entry.start && prev.bullets.length > 0) {
      // This entry has no bullets and no dates — likely a title for the previous entry
      if (!prev.title && entry.title) {
        prev.title = entry.title;
      }
      if (!prev.company && entry.company) {
        prev.company = entry.company;
      }
      entries.splice(i, 1);
    }
  }

  // Post-process: merge entries that have NO title AND NO company into the
  // previous entry. These are orphan date+bullet entries created by
  // multi-column PDF interleaving (e.g. "2008 – Present" with no heading).
  for (let i = entries.length - 1; i > 0; i--) {
    const entry = entries[i];
    const prev = entries[i - 1];
    if (!entry.title && !entry.company && entry.bullets.length > 0) {
      // Absorb bullets into previous entry
      prev.bullets.push(...entry.bullets);
      // If prev has no dates but this orphan does, adopt them
      if (!prev.start && entry.start) {
        prev.start = entry.start;
        prev.end = entry.end;
      }
      entries.splice(i, 1);
    }
  }

  return entries;
}

function parsePositionLine(line: string): ExperienceEntry | null {
  // Skip date-like lines — these are dates, not position headers
  if (/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line)) return null;
  if (/^\d{4}\s*[-–—]/.test(line)) return null;
  // Skip "Project:" and "Tools & Technologies:" lines — handled as context in extractExperience
  if (/^(project|tools\s*&?\s*technologies)\s*:/i.test(line)) return null;
  // Skip sub-heading labels
  if (/^(roles?\s*(and|&)?\s*responsibilities|key\s*responsibilities)\s*:?\s*$/i.test(line)) return null;
  // Skip lines that start with bullet markers — they're content, not position headers
  if (/^[•·●▪◦*]\s/.test(line) || /^-\s/.test(line)) return null;

  // "Company:" lines are handled in extractExperience (update, not create)
  if (/^Company:\s*/i.test(line)) return null;

  // Pattern: "Title — Company (dates)" or "Title at Company" or "Company — Title"

  // 1. "Senior Engineer — Acme Corp (2021–Present)"
  const p1 = line.match(/^(.+?)\s*[—–\-|]\s*(.+?)\s*\((.+?)\)$/);
  if (p1) return buildEntry(p1[1], p1[2], p1[3]);

  // 2. "Senior Engineer — Acme Corp, 2021–Present"
  const p2 = line.match(/^(.+?)\s*[—–\-|]\s*(.+?),\s*(\d{4}.*)$/);
  if (p2) return buildEntry(p2[1], p2[2], p2[3]);

  // 3. "Senior Engineer at Acme Corp" or "Front End Dveloper at Conveyancing, Sydney"
  const atMatch = line.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    const leftSide = atMatch[1].trim();
    const rightSide = atMatch[2].trim();
    // Match if left side contains a title word, OR if right side ends with a location (City)
    if (isLikelyTitle(leftSide) || /,\s*[A-Z][a-zA-Z\s]+$/.test(rightSide)) {
      return buildEntry(leftSide, rightSide, undefined);
    }
  }

  // 4. "Acme Corp — Senior Engineer" (em/en dash or pipe, or space-surrounded hyphen)
  // Regular hyphens in compound words (single-page, cross-functional) are NOT separators
  if (line.length < 100) {
    const p4 = line.match(/^(.+?)\s*[—–|]\s*(.+)$/) || line.match(/^(.+?)\s+\-\s+(.+)$/);
    if (p4) return buildEntry(p4[1], p4[2], undefined);
  }

  // Single line that looks like a position
  if (isLikelyTitle(line) && !line.startsWith("•") && !line.startsWith("-") && line.length < 100) {
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

function buildEntry(rawTitle: string, rawCompany: string, dateStr: string | undefined): ExperienceEntry {
  let title = rawTitle.trim();
  let company = rawCompany.trim();

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

    if (hasDegree || /university|college|institute|school|board|education/i.test(line)) {
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

/**
 * Strip the [LINKS] section appended by the file parser and return
 * the main text plus any hidden URLs found in it.
 */
function stripLinksSection(text: string): { mainText: string; hiddenLinks: string[] } {
  const marker = "\n[LINKS]\n";
  const idx = text.indexOf(marker);
  if (idx === -1) {
    // Also check if text starts with [LINKS]
    if (text.startsWith("[LINKS]\n")) {
      const urls = text.slice("[LINKS]\n".length).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      return { mainText: "", hiddenLinks: urls };
    }
    return { mainText: text, hiddenLinks: [] };
  }
  const mainText = text.slice(0, idx);
  const linksBlock = text.slice(idx + marker.length);
  const urls = linksBlock.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return { mainText, hiddenLinks: urls };
}

/**
 * Extract links from resume text.
 * 1. Merges hidden URLs from the [LINKS] section (PDF annotations / DOCX hyperlinks)
 * 2. Scans the header area for visible URLs (LinkedIn, GitHub, general https/www)
 * 3. Deduplicates and normalizes (lowercase domain, strip trailing slash)
 */
export function extractLinks(text: string, hiddenLinks: string[] = []): string[] {
  const urls = new Set<string>();

  // 1. Add hidden links
  for (const link of hiddenLinks) {
    urls.add(normalizeUrl(link));
  }

  // 2. Scan header area (first 1000 chars) for visible URLs
  const headerArea = text.slice(0, 1000);

  // LinkedIn: linkedin.com/in/<user>
  const linkedinMatches = headerArea.matchAll(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi);
  for (const m of linkedinMatches) {
    urls.add(normalizeUrl(m[0]));
  }

  // GitHub: github.com/<user>
  const githubMatches = headerArea.matchAll(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi);
  for (const m of githubMatches) {
    urls.add(normalizeUrl(m[0]));
  }

  // General URLs: https://... or http://...
  const httpMatches = headerArea.matchAll(/https?:\/\/[^\s,|)>\]]+/gi);
  for (const m of httpMatches) {
    urls.add(normalizeUrl(m[0]));
  }

  // www-prefixed URLs without protocol
  const wwwMatches = headerArea.matchAll(/(?<![/])www\.[^\s,|)>\]]+/gi);
  for (const m of wwwMatches) {
    urls.add(normalizeUrl(m[0]));
  }

  return Array.from(urls);
}

/**
 * Normalize a URL: ensure protocol, lowercase domain, strip trailing slash.
 */
function normalizeUrl(raw: string): string {
  let url = raw.trim();
  // Add https:// if no protocol
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  // Strip trailing slash
  url = url.replace(/\/+$/, "");
  // Lowercase the domain portion
  try {
    const parsed = new URL(url);
    return parsed.origin.toLowerCase() + parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}
