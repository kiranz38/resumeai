"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Modern ATS Resume Template
 * Single-column, ATS-safe, system fonts only, print-friendly.
 */
export default function ModernAtsResume({ resume }: { resume: DocResume }) {
  const r = resume;
  const totalBullets = r.experience.reduce((n, e) => n + e.bullets.length, 0);
  const isLong = totalBullets > 25;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-900">
      {/* Template label (UI only, hidden on print) */}
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Modern ATS
      </p>

      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900">
          {r.name}
        </h1>
        {r.headline && (
          <p className="mt-1 text-[15px] text-gray-600">{r.headline}</p>
        )}
        <ContactRow
          email={r.email}
          phone={r.phone}
          location={r.location}
          links={r.links}
        />
      </header>

      {/* ── Professional Summary ── */}
      {r.summary && (
        <Section title="Professional Summary">
          <p className="text-[14px] leading-relaxed text-gray-700">
            {r.summary}
          </p>
        </Section>
      )}

      {/* ── Experience ── */}
      {r.experience.length > 0 && (
        <Section title="Experience">
          {r.experience.map((exp, i) => (
            <div key={i} className={i > 0 ? "mt-4" : ""}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[14px] font-semibold text-gray-900">
                  {exp.company}
                </span>
                {exp.location && (
                  <span className="text-[12px] text-gray-500">
                    {exp.location}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[13px] font-medium text-gray-700">
                  {exp.title}
                </span>
                <DateRange start={exp.start} end={exp.end} />
              </div>
              <ul className="mt-1.5 space-y-1">
                {exp.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-[13px] leading-snug text-gray-700"
                  >
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {exp.tech && exp.tech.length > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Tech: {exp.tech.join(", ")}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── Skills ── */}
      {r.skills.groups.length > 0 && (
        <Section title="Skills">
          <div className="space-y-1.5">
            {r.skills.groups.map((g, i) => (
              <div key={i} className="text-[13px] text-gray-700">
                <span className="font-semibold text-gray-900">{g.label}: </span>
                {g.items.join(" \u2022 ")}
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
              <p className="text-[13px] font-semibold text-gray-900">
                {p.name}
              </p>
              <ul className="mt-1 space-y-1">
                {p.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-[13px] leading-snug text-gray-700"
                  >
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {p.tech && p.tech.length > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Tech: {p.tech.join(", ")}
                </p>
              )}
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
                <span className="text-[13px] font-semibold text-gray-900">
                  {edu.school}
                </span>
                {edu.degree && (
                  <span className="text-[13px] text-gray-700">
                    {" \u2014 "}
                    {edu.degree}
                  </span>
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
          <p className="text-[13px] text-gray-700">
            {r.certifications.join(" \u2022 ")}
          </p>
        </Section>
      )}

      {/* ── ATS hint (UI only) ── */}
      <p className="mt-6 text-[10px] italic text-gray-400 print:hidden">
        Tip: Keep formatting simple for ATS. This template is optimized for
        applicant tracking systems.
      </p>

      {/* ── Content-length warning ── */}
      {isLong && (
        <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 print:hidden">
          Content is long; consider trimming bullets to fit on 1-2 pages.
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 border-b border-gray-300 pb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500">
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
    <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[12px] text-gray-500">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="mr-2 text-gray-300">|</span>}
          {part}
        </span>
      ))}
    </p>
  );
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  if (!start && !end) return null;
  const text = [start, end].filter(Boolean).join(" \u2013 ");
  return <span className="text-[12px] text-gray-500">{text}</span>;
}
