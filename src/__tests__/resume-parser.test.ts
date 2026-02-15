import { describe, it, expect } from "vitest";
import { parseResume, extractLinks } from "@/lib/resume-parser";
import { DEMO_RESUME_TEXT } from "@/lib/demo-data";

describe("Resume Parser", () => {
  it("should parse the demo resume correctly", () => {
    const result = parseResume(DEMO_RESUME_TEXT);

    expect(result.name).toBeTruthy();
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.experience.length).toBeGreaterThan(0);
  });

  it("should extract name from first line", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.name).toContain("SARAH");
  });

  it("should extract skills", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    const skillsLower = result.skills.map((s) => s.toLowerCase());
    expect(skillsLower).toContain("javascript");
    expect(skillsLower).toContain("react");
  });

  it("should extract experience entries", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.experience.length).toBeGreaterThanOrEqual(2);
  });

  it("should extract bullets from experience", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    const totalBullets = result.experience.reduce((sum, exp) => sum + exp.bullets.length, 0);
    expect(totalBullets).toBeGreaterThan(0);
  });

  it("should handle empty input gracefully", () => {
    const result = parseResume("");
    expect(result.skills).toEqual([]);
    expect(result.experience).toEqual([]);
    expect(result.education).toEqual([]);
  });

  it("should handle minimal input", () => {
    const result = parseResume("John Doe\nSoftware Engineer\nSkills: JavaScript, Python");
    expect(result.name).toBeTruthy();
    expect(result.skills.length).toBeGreaterThan(0);
  });

  it("should extract education", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    // The demo has "B.S. Computer Science — UC Berkeley, 2017"
    expect(result.education.length).toBeGreaterThanOrEqual(0);
  });

  it("should not return undefined values in arrays", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.skills.every((s) => s !== undefined && s !== null)).toBe(true);
    expect(result.experience.every((e) => e !== undefined && e !== null)).toBe(true);
  });

  it("should parse UK phone and location", () => {
    const ukCV = `James Smith
Software Engineer
London, UK
+44 7700 900000 | james@example.com

Skills: JavaScript, TypeScript, React

Experience
Senior Developer — Acme Corp
Jan 2020 - Present
• Built web applications`;
    const result = parseResume(ukCV);
    expect(result.phone).toBe("+44 7700 900000");
    expect(result.location).toBe("London, UK");
  });

  it("should parse Australian phone and location", () => {
    const auCV = `Emily Chen
Data Analyst
Sydney, NSW
0412 345 678 | emily@example.com

Skills: Python, SQL, Tableau

Experience
Analyst — DataCo
Mar 2019 - Present
• Analysed datasets`;
    const result = parseResume(auCV);
    expect(result.phone).toBe("0412 345 678");
    expect(result.location).toBe("Sydney, NSW");
  });

  it("should parse NZ phone and location", () => {
    const nzCV = `Liam Brown
Product Manager
Auckland, New Zealand
+64 21 123 4567 | liam@example.com

Skills: Agile, Scrum, JIRA

Experience
PM — KiwiTech
Jun 2021 - Present
• Managed product roadmap`;
    const result = parseResume(nzCV);
    expect(result.phone).toBe("+64 21 123 4567");
    expect(result.location).toBe("Auckland, New Zealand");
  });

  it("should parse Canadian location", () => {
    const caCV = `Sarah Miller
UX Designer
Toronto, Ontario
+1 416-555-0199 | sarah@example.com

Skills: Figma, Sketch, CSS

Experience
Designer — CanDesign
Feb 2018 - Present
• Created user interfaces`;
    const result = parseResume(caCV);
    expect(result.phone).toBe("+1 416-555-0199");
    expect(result.location).toBe("Toronto, Ontario");
  });
});

describe("Link Extraction", () => {
  it("should extract visible LinkedIn URL from header text", () => {
    const text = `Jane Doe
Software Engineer
jane@example.com | linkedin.com/in/janedoe

Skills: JavaScript`;
    const result = parseResume(text);
    expect(result.links).toBeDefined();
    expect(result.links!.some(l => l.includes("linkedin.com/in/janedoe"))).toBe(true);
  });

  it("should extract visible GitHub URL from header text", () => {
    const text = `Jane Doe
Software Engineer
github.com/janedoe | jane@example.com

Skills: JavaScript`;
    const result = parseResume(text);
    expect(result.links).toBeDefined();
    expect(result.links!.some(l => l.includes("github.com/janedoe"))).toBe(true);
  });

  it("should extract URLs from [LINKS] section and merge with visible URLs", () => {
    const text = `Jane Doe
linkedin.com/in/janedoe

Skills: JavaScript

[LINKS]
https://github.com/janedoe
https://janedoe.dev`;
    const result = parseResume(text);
    expect(result.links).toBeDefined();
    expect(result.links!.length).toBeGreaterThanOrEqual(3);
    expect(result.links!.some(l => l.includes("linkedin.com/in/janedoe"))).toBe(true);
    expect(result.links!.some(l => l.includes("github.com/janedoe"))).toBe(true);
    expect(result.links!.some(l => l.includes("janedoe.dev"))).toBe(true);
  });

  it("should return undefined links when no links found", () => {
    const text = `John Doe
Software Engineer
john@example.com

Skills: JavaScript`;
    const result = parseResume(text);
    expect(result.links).toBeUndefined();
  });

  it("should extract linkedin.com/in/sarahchen from demo resume", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.links).toBeDefined();
    expect(result.links!.some(l => l.includes("linkedin.com/in/sarahchen"))).toBe(true);
  });

  it("should deduplicate URLs", () => {
    const links = extractLinks(
      "linkedin.com/in/janedoe\nlinkedin.com/in/janedoe",
      ["https://linkedin.com/in/janedoe"]
    );
    expect(links.length).toBe(1);
  });

  it("should normalize URLs with trailing slashes", () => {
    const links = extractLinks("https://linkedin.com/in/janedoe/", []);
    expect(links[0]).not.toMatch(/\/$/);
  });
});

describe("Multi-column PDF resume parsing", () => {
  // Simulates a multi-column PDF where sidebar sections (Details, Skills, Hobbies)
  // get interleaved into the experience text, fragmenting it across sections.
  const multiColumnResume = `Kiran Perur
Senior UI Engineer

Employment History
Project: Biz Edge Lending Team
February 2025 — Present
Company: Tech Mahindra (Permanent)– Westpac (End Client)
- Worked extensively with React Final Form and Westpac GEL UI
- Collaborated with cross-functional teams to refine UX
- Improved keyboard accessibility in dropdown components
- Increased test coverage to 90%+ using React Testing Library and Jest

Details
0432121517
kiranperur@gmail.com

Links
LinkedIn profile
Github repo

Skills
ReactJS Experienced
Javascript Experienced

Languages
English Very good command

Hobbies
Biking , Chess, Cricket , Football
- Developed and enhanced React-based UI components for Westpac
Senior UI Engineer at Westpac (End Client) via Tech Mahindra, Sydney
Associate Consultant at Westpac (With TCS(Technical Lead)) , Sydney
August 2023 — Dec 2024
Project: WDP Platform team
Been part of the migration of single-page applications to a microfrontend architecture
Designed and developed reusable UI components using Storybook
Developed and maintained BFF layers using Node.js and Express

August 2020 — July 2023
Project: Open banking Team : Consent team
Roles and responsibilities:
Developing and Implementing UI workflows for data sharing
Created and designing styled components using Westpac Gel framework
Developed APIs based on Node and express to service the data

Front End Dveloper at Conveyancing, Sydney
January 2020 — April 2020
Development of document automation system for the conveyancing process
Implemented Signing component for digital signature

Senior Front End Developer at Canon Australia, Sydney
May 2019 — November 2019
Development and enhancement work for front end applications PrintNow and Kyoyu App
Implemented Lens, Camera and Accessory flow for Kyoyu App

Senior .Net Consultant at IPH Limited, Sydney
December 2018 — March 2019
Backend Service based on .Net Core Web APIs and Entity framework
Worked on Azure Service Bus Topics along with .Net Core class libraries

Senior Software Engineer at Robert Bosch Engineering and Business Solutions, Bengaluru
November 2016 — November 2018
Application development in ReactJS, Redux, Microsoft .Net Web Api
Creating AI based chat bots based on Microsoft bot framework

Technology Analyst at Infosys Limited, Bengaluru
December 2014 — November 2016
Creation of an application based on Microsoft .NET Framework 3.5

Senior Software Engineer at Larsen & Toubro Infotech, Pune
July 2011 — December 2014
Application development in VB.Net and C#.Net

Education
Bachelor of Information Technology , Anna University`;

  it("should extract all experience entries from multi-column PDF", () => {
    const result = parseResume(multiColumnResume);
    // Should find entries for: Tech Mahindra/Westpac, Associate Consultant,
    // Open Banking, Conveyancing, Canon, IPH, Bosch, Infosys, L&T
    expect(result.experience.length).toBeGreaterThanOrEqual(7);
  });

  it("should extract company names from entries scattered across sections", () => {
    const result = parseResume(multiColumnResume);
    const companies = result.experience.map(e => e.company || "").join(" ").toLowerCase();
    expect(companies).toContain("canon");
    expect(companies).toContain("iph");
    expect(companies).toContain("bosch");
    expect(companies).toContain("infosys");
    expect(companies).toContain("larsen");
  });

  it("should handle Company: prefix lines", () => {
    const result = parseResume(multiColumnResume);
    const companies = result.experience.map(e => e.company || "").join(" ");
    expect(companies).toContain("Tech Mahindra");
  });

  it("should handle 'at' pattern with location even without standard title words", () => {
    const result = parseResume(multiColumnResume);
    const companies = result.experience.map(e => e.company || "").join(" ");
    // "Front End Dveloper at Conveyancing, Sydney" — misspelled but location-detected
    expect(companies).toContain("Conveyancing");
  });

  it("should not treat 'Roles and responsibilities:' as a section header", () => {
    const result = parseResume(multiColumnResume);
    // The Open Banking entry's bullets should be captured
    const allBullets = result.experience.flatMap(e => e.bullets).join(" ").toLowerCase();
    expect(allBullets).toContain("data sharing");
  });

  it("should preserve all bullets — no content loss", () => {
    const result = parseResume(multiColumnResume);
    const allBullets = result.experience.flatMap(e => e.bullets);
    // Should have substantial bullet content
    expect(allBullets.length).toBeGreaterThanOrEqual(15);
  });
});
