"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Classic Professional Template
 * Traditional serif styling with ruled sections for formal industries.
 * ATS-safe, no tables, no images, system fonts, print-friendly.
 */
export default function ClassicProfessional({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white font-serif text-gray-900">
      <p className="mb-2 text-[10px] font-sans text-gray-400 print:hidden">
        Template: Classic Professional
      </p>

      {/* ── Header ── */}
      <header className="mb-4 border-b-2 border-gray-800 pb-3">
        <h1 className="text-[28px] font-bold tracking-wide text-gray-900">
          {r.name}
        </h1>
        {r.headline && (
          <p className="mt-0.5 text-[14px] italic text-gray-600">{r.headline}</p>
        )}
        <ContactRow email={r.email} phone={r.phone} location={r.location} links={r.links} />
      </header>

      {/* ── Summary ── */}
      {r.summary && (
        <Section title="Professional Summary">
          <p className="text-[13px] leading-relaxed text-gray-700">{r.summary}</p>
        </Section>
      )}

      {/* ── Experience ── */}
      {r.experience.length > 0 && (
        <Section title="Professional Experience">
          {r.experience.map((exp, i) => (
            <div key={i} className={i > 0 ? "mt-4" : ""}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[14px] font-bold text-gray-900">
                  {exp.title}
                </span>
                <DateRange start={exp.start} end={exp.end} />
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[13px] italic text-gray-600">
                  {exp.company}
                  {exp.location && <>, {exp.location}</>}
                </span>
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-[13px] leading-snug text-gray-700">
                    <span className="mt-[5px] shrink-0 text-gray-400">&bull;</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
                  <span className="text-[13px] text-gray-700">, {edu.degree}</span>
                )}
              </div>
              <DateRange start={edu.start} end={edu.end} />
            </div>
          ))}
        </Section>
      )}

      {/* ── Skills ── */}
      {r.skills.groups.length > 0 && (
        <Section title="Skills">
          <div className="space-y-1">
            {r.skills.groups.map((g, i) => (
              <div key={i} className="text-[13px] text-gray-700">
                <span className="font-bold text-gray-900">{g.label}: </span>
                {g.items.join(", ")}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Projects ── */}
      {r.projects && r.projects.length > 0 && (
        <Section title="Projects">
          {r.projects.map((p, i) => (
            <div key={i} className={i > 0 ? "mt-3" : ""}>
              <p className="text-[13px] font-bold text-gray-900">{p.name}</p>
              <ul className="mt-1 space-y-0.5">
                {p.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-[13px] leading-snug text-gray-700">
                    <span className="mt-[5px] shrink-0 text-gray-400">&bull;</span>
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
        <Section title="Certifications">
          <p className="text-[13px] text-gray-700">{r.certifications.join(", ")}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 border-b border-gray-400 pb-0.5 text-[13px] font-bold uppercase tracking-wide text-gray-800">
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
    <p className="mt-1 text-[12px] font-sans text-gray-500">
      {parts.join(" | ")}
    </p>
  );
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  if (!start && !end) return null;
  const text = [start, end].filter(Boolean).join(" \u2013 ");
  return <span className="text-[12px] font-sans text-gray-500">{text}</span>;
}
