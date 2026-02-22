"use client";

import type { DocResume } from "@/lib/pro-document";

/**
 * Two-Column Template
 * Left sidebar for photo, contact, skills, education; right main column for experience.
 * ATS-safe — uses CSS flex, no tables. System fonts, print-friendly.
 */
export default function TwoColumn({ resume }: { resume: DocResume }) {
  const r = resume;

  return (
    <div className="ats-resume mx-auto max-w-[800px] bg-white text-gray-900">
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Two-Column
      </p>

      <div className="flex">
        {/* ── Left sidebar ── */}
        <div className="w-[230px] shrink-0 space-y-5 bg-gray-50 p-5 print:bg-gray-50">
          {/* Photo + Name */}
          <div className="text-center">
            {r.photoUrl ? (
              <img
                src={r.photoUrl}
                alt={r.name}
                className="mx-auto mb-3 h-24 w-24 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-400">
                {r.name ? r.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <h1 className="text-[18px] font-bold leading-tight text-gray-900">
              {r.name}
            </h1>
            {r.headline && (
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                {r.headline}
              </p>
            )}
          </div>

          {/* Contact */}
          <SidebarSection title="Contact">
            <div className="space-y-1.5 text-[11px] text-gray-600">
              {r.email && (
                <div className="flex items-start gap-1.5">
                  <svg className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span>{r.email}</span>
                </div>
              )}
              {r.phone && (
                <div className="flex items-start gap-1.5">
                  <svg className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span>{r.phone}</span>
                </div>
              )}
              {r.location && (
                <div className="flex items-start gap-1.5">
                  <svg className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                  </svg>
                  <span>{r.location}</span>
                </div>
              )}
              {r.links?.map((link, i) => (
                <p key={i} className="break-all pl-[18px]">{link}</p>
              ))}
            </div>
          </SidebarSection>

          {/* Skills */}
          {r.skills.groups.length > 0 && (
            <SidebarSection title="Skills">
              <div className="space-y-2.5">
                {r.skills.groups.map((g, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {g.label}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.items.map((item, j) => (
                        <span
                          key={j}
                          className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-600 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Education */}
          {r.education && r.education.length > 0 && (
            <SidebarSection title="Education">
              {r.education.map((edu, i) => (
                <div key={i} className={i > 0 ? "mt-2.5" : ""}>
                  <p className="text-[11px] font-semibold text-gray-900">
                    {edu.school}
                  </p>
                  {edu.degree && (
                    <p className="text-[10px] text-gray-600">{edu.degree}</p>
                  )}
                  {(edu.start || edu.end) && (
                    <p className="text-[10px] text-gray-400">
                      {[edu.start, edu.end].filter(Boolean).join(" \u2013 ")}
                    </p>
                  )}
                </div>
              ))}
            </SidebarSection>
          )}

          {/* Certifications */}
          {r.certifications && r.certifications.length > 0 && (
            <SidebarSection title="Certifications">
              <ul className="space-y-0.5">
                {r.certifications.map((c, i) => (
                  <li key={i} className="text-[11px] text-gray-600">
                    {c}
                  </li>
                ))}
              </ul>
            </SidebarSection>
          )}
        </div>

        {/* ── Right main column ── */}
        <div className="min-w-0 flex-1 p-5">
          {/* Summary */}
          {r.summary && (
            <MainSection title="Professional Summary">
              <p className="text-[13px] leading-relaxed text-gray-600">
                {r.summary}
              </p>
            </MainSection>
          )}

          {/* Experience */}
          {r.experience.length > 0 && (
            <MainSection title="Experience">
              {r.experience.map((exp, i) => (
                <div key={i} className={i > 0 ? "mt-4" : ""}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-[14px] font-bold text-gray-900">
                      {exp.title}
                    </span>
                    {(exp.start || exp.end) && (
                      <span className="text-[11px] font-medium text-gray-400">
                        {[exp.start, exp.end].filter(Boolean).join(" \u2013 ")}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-medium text-blue-600">
                    {exp.company}
                    {exp.location && (
                      <span className="font-normal text-gray-400"> &middot; {exp.location}</span>
                    )}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="flex gap-1.5 text-[12px] leading-snug text-gray-700">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </MainSection>
          )}

          {/* Projects */}
          {r.projects && r.projects.length > 0 && (
            <MainSection title="Projects">
              {r.projects.map((p, i) => (
                <div key={i} className={i > 0 ? "mt-3" : ""}>
                  <p className="text-[13px] font-bold text-gray-900">{p.name}</p>
                  <ul className="mt-1 space-y-0.5">
                    {p.bullets.map((b, j) => (
                      <li key={j} className="flex gap-1.5 text-[12px] leading-snug text-gray-700">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </MainSection>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
        {title}
      </h2>
      {children}
    </div>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h2 className="mb-2.5 border-b border-gray-200 pb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-gray-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
