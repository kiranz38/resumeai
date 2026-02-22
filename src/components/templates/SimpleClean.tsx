"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Simple Clean Template
 * No lines, no dividers — maximum ATS safety for government and corporate roles.
 * ATS-safe, no tables, no images, system fonts, print-friendly.
 */
export default function SimpleClean({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-900">
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Simple Clean
      </p>

      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-[30px] font-bold text-gray-900">
          {r.name}
        </h1>
        {r.headline && (
          <p className="mt-0.5 text-[14px] text-gray-600">{r.headline}</p>
        )}
        <ContactRow email={r.email} phone={r.phone} location={r.location} links={r.links} />
      </header>

      {/* ── Summary ── */}
      {r.summary && (
        <Section title="PROFESSIONAL SUMMARY">
          <p className="text-[13px] leading-relaxed text-gray-700">{r.summary}</p>
        </Section>
      )}

      {/* ── Experience ── */}
      {r.experience.length > 0 && (
        <Section title="EXPERIENCE">
          {r.experience.map((exp, i) => (
            <div key={i} className={i > 0 ? "mt-4" : ""}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[14px] font-semibold text-gray-900">
                  {exp.company}
                </span>
                {(exp.start || exp.end) && (
                  <span className="text-[12px] text-gray-500">
                    {[exp.start, exp.end].filter(Boolean).join(" \u2013 ")}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-700">
                {exp.title}
                {exp.location && <span className="text-gray-500"> | {exp.location}</span>}
              </p>
              <ul className="mt-1.5 space-y-1">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="pl-4 text-[13px] leading-snug text-gray-700">
                    - {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* ── Skills ── */}
      {r.skills.groups.length > 0 && (
        <Section title="SKILLS">
          <div className="space-y-1">
            {r.skills.groups.map((g, i) => (
              <div key={i} className="text-[13px] text-gray-700">
                <span className="font-semibold text-gray-900">{g.label}: </span>
                {g.items.join(", ")}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Projects ── */}
      {r.projects && r.projects.length > 0 && (
        <Section title="PROJECTS">
          {r.projects.map((p, i) => (
            <div key={i} className={i > 0 ? "mt-3" : ""}>
              <p className="text-[13px] font-semibold text-gray-900">{p.name}</p>
              <ul className="mt-1 space-y-0.5">
                {p.bullets.map((b, j) => (
                  <li key={j} className="pl-4 text-[13px] leading-snug text-gray-700">
                    - {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* ── Education ── */}
      {r.education && r.education.length > 0 && (
        <Section title="EDUCATION">
          {r.education.map((edu, i) => (
            <div
              key={i}
              className={`flex flex-wrap items-baseline justify-between gap-x-3 ${i > 0 ? "mt-1.5" : ""}`}
            >
              <div>
                <span className="text-[13px] font-semibold text-gray-900">{edu.school}</span>
                {edu.degree && (
                  <span className="text-[13px] text-gray-700"> - {edu.degree}</span>
                )}
              </div>
              {(edu.start || edu.end) && (
                <span className="text-[12px] text-gray-500">
                  {[edu.start, edu.end].filter(Boolean).join(" \u2013 ")}
                </span>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── Certifications ── */}
      {r.certifications && r.certifications.length > 0 && (
        <Section title="CERTIFICATIONS">
          <ul className="space-y-0.5">
            {r.certifications.map((c, i) => (
              <li key={i} className="text-[13px] text-gray-700">
                - {c}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-[13px] font-bold tracking-wide text-gray-900">
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
    <p className="mt-1 text-[12px] text-gray-500">
      {parts.join(" | ")}
    </p>
  );
}
