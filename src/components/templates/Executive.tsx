"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Executive Template
 * Refined centered header with optional photo, premium typography.
 * For senior leadership and C-suite roles.
 * ATS-safe, no tables, system fonts, print-friendly.
 */
export default function Executive({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-900">
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Executive
      </p>

      {/* ── Header — centered, refined ── */}
      <header className="mb-6 border-b border-gray-200 pb-5 text-center">
        {/* Optional photo */}
        {r.photoUrl ? (
          <img
            src={r.photoUrl}
            alt={r.name}
            className="mx-auto mb-3 h-24 w-24 rounded-full object-cover shadow-md ring-2 ring-gray-100"
          />
        ) : (
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-3xl font-bold text-gray-300">
            {r.name ? r.name.charAt(0).toUpperCase() : "?"}
          </div>
        )}
        <h1 className="text-[32px] font-bold uppercase tracking-[0.06em] text-gray-900">
          {r.name}
        </h1>
        {r.headline && (
          <p className="mt-1 text-[14px] font-light tracking-[0.05em] text-gray-500">
            {r.headline}
          </p>
        )}
        <ContactRow email={r.email} phone={r.phone} location={r.location} links={r.links} />
        <div className="mx-auto mt-3 h-[2px] w-16 bg-gray-800" />
      </header>

      {/* ── Summary ── */}
      {r.summary && (
        <Section title="Executive Summary">
          <p className="text-[13px] leading-relaxed text-gray-600">{r.summary}</p>
        </Section>
      )}

      {/* ── Experience ── */}
      {r.experience.length > 0 && (
        <Section title="Professional Experience">
          {r.experience.map((exp, i) => (
            <div key={i} className={i > 0 ? "mt-5" : ""}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  {exp.title}
                </h3>
                <DateRange start={exp.start} end={exp.end} />
              </div>
              <p className="text-[13px] font-medium text-gray-500">
                {exp.company}
                {exp.location && <> &mdash; {exp.location}</>}
              </p>
              <ul className="mt-2 space-y-1">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-[13px] leading-snug text-gray-700">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* ── Core Competencies ── */}
      {r.skills.groups.length > 0 && (
        <Section title="Core Competencies">
          <div className="space-y-1.5">
            {r.skills.groups.map((g, i) => (
              <div key={i} className="text-[13px] text-gray-700">
                <span className="font-bold text-gray-900">{g.label}: </span>
                {g.items.join(" \u2022 ")}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Education ── */}
      {r.education && r.education.length > 0 && (
        <Section title="Education">
          {r.education.map((edu, i) => (
            <div
              key={i}
              className={`flex flex-wrap items-baseline justify-between gap-x-3 ${i > 0 ? "mt-1.5" : ""}`}
            >
              <div>
                <span className="text-[13px] font-bold text-gray-900">{edu.school}</span>
                {edu.degree && (
                  <span className="text-[13px] text-gray-600"> &mdash; {edu.degree}</span>
                )}
              </div>
              <DateRange start={edu.start} end={edu.end} />
            </div>
          ))}
        </Section>
      )}

      {/* ── Projects ── */}
      {r.projects && r.projects.length > 0 && (
        <Section title="Key Projects &amp; Initiatives">
          {r.projects.map((p, i) => (
            <div key={i} className={i > 0 ? "mt-3" : ""}>
              <p className="text-[13px] font-bold text-gray-900">{p.name}</p>
              <ul className="mt-1 space-y-0.5">
                {p.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-[13px] leading-snug text-gray-700">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* ── Certifications ── */}
      {r.certifications && r.certifications.length > 0 && (
        <Section title="Certifications &amp; Credentials">
          <p className="text-[13px] text-gray-700">{r.certifications.join(" \u2022 ")}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 border-b-2 border-gray-200 pb-1 text-[12px] font-bold uppercase tracking-[0.1em] text-gray-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactRow({
  email,
  phone,
  location,
  links,
}: {
  email?: string;
  phone?: string;
  location?: string;
  links?: string[];
}) {
  const parts: string[] = [];
  if (email) parts.push(email);
  if (phone) parts.push(phone);
  if (location) parts.push(location);
  if (links) parts.push(...links);
  if (parts.length === 0) return null;

  return (
    <p className="mt-2 text-[12px] tracking-wide text-gray-400">
      {parts.join(" \u2022 ")}
    </p>
  );
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  if (!start && !end) return null;
  const text = [start, end].filter(Boolean).join(" \u2013 ");
  return <span className="text-[12px] font-medium text-gray-400">{text}</span>;
}
