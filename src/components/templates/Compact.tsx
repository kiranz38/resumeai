"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Compact Template
 * Tight spacing and small margins to fit 2+ pages of experience on 1 page.
 * ATS-safe, no tables, no images, system fonts, print-friendly.
 */
export default function Compact({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-900 text-[12px] leading-[1.35]">
      <p className="mb-1 text-[10px] text-gray-400 print:hidden">
        Template: Compact
      </p>

      {/* ── Header ── */}
      <header className="mb-3">
        <h1 className="text-[24px] font-bold leading-tight text-gray-900">
          {r.name}
        </h1>
        {r.headline && (
          <p className="text-[12px] text-gray-600">{r.headline}</p>
        )}
        <ContactRow email={r.email} phone={r.phone} location={r.location} links={r.links} />
      </header>

      {/* ── Summary ── */}
      {r.summary && (
        <Section title="Summary">
          <p className="text-gray-700">{r.summary}</p>
        </Section>
      )}

      {/* ── Experience ── */}
      {r.experience.length > 0 && (
        <Section title="Experience">
          {r.experience.map((exp, i) => (
            <div key={i} className={i > 0 ? "mt-2" : ""}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-bold text-gray-900">
                  {exp.title}, {exp.company}
                </span>
                <span className="text-[11px] text-gray-500">
                  {[exp.location, [exp.start, exp.end].filter(Boolean).join("\u2013")]
                    .filter(Boolean)
                    .join(" | ")}
                </span>
              </div>
              <ul className="mt-0.5 space-y-0">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="flex gap-1.5 text-gray-700">
                    <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-gray-400" />
                    <span>{b}</span>
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
          {r.skills.groups.map((g, i) => (
            <span key={i} className="text-gray-700">
              <span className="font-semibold text-gray-900">{g.label}: </span>
              {g.items.join(", ")}
              {i < r.skills.groups.length - 1 && " | "}
            </span>
          ))}
        </Section>
      )}

      {/* ── Projects ── */}
      {r.projects && r.projects.length > 0 && (
        <Section title="Projects">
          {r.projects.map((p, i) => (
            <div key={i} className={i > 0 ? "mt-1.5" : ""}>
              <p className="font-bold text-gray-900">{p.name}</p>
              <ul className="mt-0.5 space-y-0">
                {p.bullets.map((b, j) => (
                  <li key={j} className="flex gap-1.5 text-gray-700">
                    <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-gray-400" />
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
            <div key={i} className={`flex flex-wrap items-baseline justify-between gap-x-2 ${i > 0 ? "mt-0.5" : ""}`}>
              <span>
                <span className="font-semibold text-gray-900">{edu.school}</span>
                {edu.degree && <span className="text-gray-700"> &mdash; {edu.degree}</span>}
              </span>
              {(edu.start || edu.end) && (
                <span className="text-[11px] text-gray-500">
                  {[edu.start, edu.end].filter(Boolean).join("\u2013")}
                </span>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── Certifications ── */}
      {r.certifications && r.certifications.length > 0 && (
        <Section title="Certifications">
          <p className="text-gray-700">{r.certifications.join(" \u2022 ")}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-2.5">
      <h2 className="mb-1 border-b border-gray-300 pb-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
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
    <p className="mt-0.5 text-[11px] text-gray-500">
      {parts.join(" | ")}
    </p>
  );
}
