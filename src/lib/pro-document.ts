/**
 * ProDocument: canonical document model shared by preview templates and all exports.
 * Maps from ProOutput (LLM output) to a clean, template-ready structure.
 */

import { z } from "zod";
import type { ProOutput } from "./schema";

// ── Zod Schemas ──

export const DocSkillGroupSchema = z.object({
  label: z.string(),
  items: z.array(z.string()),
});

export const DocExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  bullets: z.array(z.string()),
  tech: z.array(z.string()).optional(),
});

export const DocProjectSchema = z.object({
  name: z.string(),
  bullets: z.array(z.string()),
  tech: z.array(z.string()).optional(),
});

export const DocEducationSchema = z.object({
  school: z.string(),
  degree: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const DocResumeSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  links: z.array(z.string()).optional(),
  summary: z.string().optional(),
  skills: z.object({ groups: z.array(DocSkillGroupSchema) }),
  experience: z.array(DocExperienceSchema),
  projects: z.array(DocProjectSchema).optional(),
  education: z.array(DocEducationSchema).optional(),
  certifications: z.array(z.string()).optional(),
  keywordsChecklist: z
    .array(z.object({ keyword: z.string(), status: z.enum(["present", "missing"]) }))
    .optional(),
});

export const DocCoverLetterSchema = z.object({
  date: z.string(),
  recipientLine: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  paragraphs: z.array(z.string()),
  closing: z.string().optional(),
  signatureName: z.string().optional(),
});

export const ProDocumentSchema = z.object({
  resume: DocResumeSchema,
  coverLetter: DocCoverLetterSchema,
});

// ── Types ──

export type DocSkillGroup = z.infer<typeof DocSkillGroupSchema>;
export type DocExperience = z.infer<typeof DocExperienceSchema>;
export type DocProject = z.infer<typeof DocProjectSchema>;
export type DocEducation = z.infer<typeof DocEducationSchema>;
export type DocResume = z.infer<typeof DocResumeSchema>;
export type DocCoverLetter = z.infer<typeof DocCoverLetterSchema>;
export type ProDocument = z.infer<typeof ProDocumentSchema>;

// ── Mapper: ProOutput → ProDocument ──

/**
 * Map a ProOutput (LLM result) into a ProDocument (template-ready structure).
 */
export function proOutputToDocument(output: ProOutput): ProDocument {
  const r = output.tailoredResume;

  return {
    resume: {
      name: r.name || "Your Name",
      headline: r.headline || undefined,
      email: r.email || undefined,
      phone: r.phone || undefined,
      location: r.location || undefined,
      links: r.links || undefined,
      summary: r.summary || undefined,
      skills: {
        groups: r.skills.map((s) => ({
          label: s.category,
          items: s.items,
        })),
      },
      experience: r.experience.map((exp) => ({
        company: exp.company,
        title: exp.title,
        start: parsePeriodStart(exp.period),
        end: parsePeriodEnd(exp.period),
        bullets: exp.bullets,
      })),
      projects: r.projects?.map((p) => ({
        name: p.name,
        bullets: p.bullets,
        tech: p.tech || undefined,
      })),
      education: r.education.map((edu) => ({
        school: edu.school,
        degree: edu.degree || undefined,
        end: edu.year || undefined,
      })),
      certifications: r.certifications || undefined,
      keywordsChecklist: output.keywordChecklist.map((k) => ({
        keyword: k.keyword,
        status: k.found ? ("present" as const) : ("missing" as const),
      })),
    },
    coverLetter: {
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      recipientLine: "Hiring Manager",
      paragraphs: output.coverLetter.paragraphs,
      closing: "Sincerely,",
      signatureName: r.name || "Your Name",
    },
  };
}

// ── Period parsing helpers ──

function parsePeriodStart(period: string): string | undefined {
  if (!period) return undefined;
  const parts = period.split(/[\u2013\u2014\-–—]+/).map((s) => s.trim());
  return parts[0] || undefined;
}

function parsePeriodEnd(period: string): string | undefined {
  if (!period) return undefined;
  const parts = period.split(/[\u2013\u2014\-–—]+/).map((s) => s.trim());
  return parts.length > 1 ? parts[1] || "Present" : undefined;
}

// ── Plain text formatter (shared by TXT export) ──

export function proDocumentToText(doc: ProDocument): string {
  const lines: string[] = [];
  const r = doc.resume;
  const cl = doc.coverLetter;

  // ── Resume ──
  lines.push(r.name.toUpperCase());
  if (r.headline) lines.push(r.headline);

  const contactParts: string[] = [];
  if (r.email) contactParts.push(r.email);
  if (r.phone) contactParts.push(r.phone);
  if (r.location) contactParts.push(r.location);
  if (r.links) contactParts.push(...r.links);
  if (contactParts.length > 0) lines.push(contactParts.join(" | "));
  lines.push("");

  if (r.summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("-".repeat(40));
    lines.push(r.summary);
    lines.push("");
  }

  if (r.experience.length > 0) {
    lines.push("EXPERIENCE");
    lines.push("-".repeat(40));
    for (const exp of r.experience) {
      const dateLine = [exp.start, exp.end].filter(Boolean).join(" - ");
      lines.push(`${exp.title} | ${exp.company}${dateLine ? ` | ${dateLine}` : ""}`);
      for (const b of exp.bullets) {
        lines.push(`  - ${b}`);
      }
      if (exp.tech && exp.tech.length > 0) {
        lines.push(`  Tech: ${exp.tech.join(", ")}`);
      }
      lines.push("");
    }
  }

  if (r.skills.groups.length > 0) {
    lines.push("SKILLS");
    lines.push("-".repeat(40));
    for (const g of r.skills.groups) {
      lines.push(`${g.label}: ${g.items.join(" \u2022 ")}`);
    }
    lines.push("");
  }

  if (r.projects && r.projects.length > 0) {
    lines.push("PROJECTS");
    lines.push("-".repeat(40));
    for (const p of r.projects) {
      lines.push(p.name);
      for (const b of p.bullets) {
        lines.push(`  - ${b}`);
      }
      lines.push("");
    }
  }

  if (r.education && r.education.length > 0) {
    lines.push("EDUCATION");
    lines.push("-".repeat(40));
    for (const edu of r.education) {
      const parts = [edu.degree, edu.school].filter(Boolean).join(" \u2014 ");
      const dateParts = [edu.start, edu.end].filter(Boolean).join(" - ");
      lines.push(`${parts}${dateParts ? ` (${dateParts})` : ""}`);
    }
    lines.push("");
  }

  if (r.certifications && r.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    lines.push("-".repeat(40));
    lines.push(r.certifications.join(", "));
    lines.push("");
  }

  // ── Cover Letter ──
  lines.push("");
  lines.push("=".repeat(50));
  lines.push("COVER LETTER");
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(cl.date);
  lines.push("");
  if (cl.recipientLine) lines.push(`Dear ${cl.recipientLine},`);
  lines.push("");
  for (const p of cl.paragraphs) {
    lines.push(p);
    lines.push("");
  }
  lines.push(cl.closing || "Sincerely,");
  lines.push(cl.signatureName || r.name);

  return lines.join("\n");
}
