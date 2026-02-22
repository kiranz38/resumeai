"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Creative Template
 * Full-width colored header with optional photo, accent color throughout.
 * Modern typography for marketing and design roles.
 * ATS-safe, no tables, no images, system fonts, print-friendly.
 */
export default function Creative({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-900">
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Creative
      </p>

      {/* ── Colored header block ── */}
      <header className="rounded-b-none bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white print:bg-blue-600">
        <div className="flex items-center gap-5">
          {/* Optional photo */}
          {r.photoUrl ? (
            <img
              src={r.photoUrl}
              alt={r.name}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-3 ring-white/30 shadow-lg"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white/80">
              {r.name ? r.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
              {r.name}
            </h1>
            {r.headline && (
              <p className="mt-0.5 text-[14px] font-medium text-blue-100">
                {r.headline}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-blue-200">
              {r.email && <span>{r.email}</span>}
              {r.phone && <span>{r.phone}</span>}
              {r.location && <span>{r.location}</span>}
              {r.links?.map((link, i) => <span key={i}>{link}</span>)}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="px-8 pb-6">
        {/* ── Summary ── */}
        {r.summary && (
          <Section title="About Me">
            <p className="text-[13px] leading-relaxed text-gray-600">
              {r.summary}
            </p>
          </Section>
        )}

        {/* ── Experience ── */}
        {r.experience.length > 0 && (
          <Section title="Experience">
            {r.experience.map((exp, i) => (
              <div key={i} className={i > 0 ? "mt-5" : ""}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-[14px] font-bold text-gray-900">
                    {exp.title}
                  </h3>
                  <DateRange start={exp.start} end={exp.end} />
                </div>
                <p className="text-[13px] font-semibold text-blue-600">
                  {exp.company}
                  {exp.location && (
                    <span className="font-normal text-gray-400"> &middot; {exp.location}</span>
                  )}
                </p>
                <ul className="mt-2 space-y-1">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 text-[13px] leading-snug text-gray-700">
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
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
            <div className="space-y-2.5">
              {r.skills.groups.map((g, i) => (
                <div key={i}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    {g.label}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {g.items.map((item, j) => (
                      <span
                        key={j}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
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
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
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
                  <span className="text-[13px] font-semibold text-gray-900">{edu.school}</span>
                  {edu.degree && (
                    <span className="text-[13px] text-gray-600"> &mdash; {edu.degree}</span>
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
            <div className="flex flex-wrap gap-1.5">
              {r.certifications.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-blue-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  if (!start && !end) return null;
  const text = [start, end].filter(Boolean).join(" \u2013 ");
  return <span className="text-[12px] font-medium text-gray-400">{text}</span>;
}
