"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Minimalist Template
 * Generous whitespace, clean sans-serif, ideal for tech and design roles.
 * ATS-safe, no tables, no images, system fonts, print-friendly.
 */
export default function Minimalist({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-800">
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Minimalist
      </p>

      {/* ── Header ── */}
      <header className="mb-10">
        <h1 className="text-[36px] font-light tracking-tight text-gray-900">
          {r.name}
        </h1>
        {r.headline && (
          <p className="mt-1 text-[15px] font-light text-gray-500">{r.headline}</p>
        )}
        <ContactRow email={r.email} phone={r.phone} location={r.location} links={r.links} />
      </header>

      {/* ── Summary ── */}
      {r.summary && (
        <Section title="About">
          <p className="text-[14px] font-light leading-relaxed text-gray-600">
            {r.summary}
          </p>
        </Section>
      )}

      {/* ── Experience ── */}
      {r.experience.length > 0 && (
        <Section title="Experience">
          {r.experience.map((exp, i) => (
            <div key={i} className={i > 0 ? "mt-6" : ""}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="text-[14px] font-medium text-gray-900">
                  {exp.title}
                </h3>
                <DateRange start={exp.start} end={exp.end} />
              </div>
              <p className="text-[13px] text-gray-500">
                {exp.company}
                {exp.location && <> &middot; {exp.location}</>}
              </p>
              <ul className="mt-2 space-y-1.5">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="text-[13px] font-light leading-snug text-gray-600 pl-4 relative">
                    <span className="absolute left-0 top-[7px] h-1 w-1 rounded-full bg-gray-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* ── Skills ── */}
      {r.skills.groups.length > 0 && (
        <Section title="Skills">
          <div className="space-y-2">
            {r.skills.groups.map((g, i) => (
              <div key={i} className="text-[13px]">
                <span className="font-medium text-gray-900">{g.label}</span>
                <span className="font-light text-gray-500"> &mdash; {g.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Projects ── */}
      {r.projects && r.projects.length > 0 && (
        <Section title="Projects">
          {r.projects.map((p, i) => (
            <div key={i} className={i > 0 ? "mt-4" : ""}>
              <h3 className="text-[13px] font-medium text-gray-900">{p.name}</h3>
              <ul className="mt-1 space-y-1">
                {p.bullets.map((b, j) => (
                  <li key={j} className="text-[13px] font-light leading-snug text-gray-600 pl-4 relative">
                    <span className="absolute left-0 top-[7px] h-1 w-1 rounded-full bg-gray-300" />
                    {b}
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
              className={`flex flex-wrap items-baseline justify-between gap-x-3 ${i > 0 ? "mt-2" : ""}`}
            >
              <div>
                <span className="text-[13px] font-medium text-gray-900">{edu.school}</span>
                {edu.degree && (
                  <span className="text-[13px] font-light text-gray-500"> &mdash; {edu.degree}</span>
                )}
              </div>
              <DateRange start={edu.start} end={edu.end} />
            </div>
          ))}
        </Section>
      )}

      {/* ── Certifications ── */}
      {r.certifications && r.certifications.length > 0 && (
        <Section title="Certifications">
          <p className="text-[13px] font-light text-gray-600">
            {r.certifications.join(" &middot; ")}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">
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
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] font-light text-gray-400">
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </p>
  );
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  if (!start && !end) return null;
  const text = [start, end].filter(Boolean).join(" \u2013 ");
  return <span className="text-[12px] font-light text-gray-400">{text}</span>;
}
