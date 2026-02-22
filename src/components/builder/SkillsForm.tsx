"use client";

import type { Dispatch } from "react";
import type { DocResume, DocProject } from "@/lib/pro-document";
import type { ResumeAction } from "@/lib/resume-reducer";

interface SkillsFormProps {
  resume: DocResume;
  dispatch: Dispatch<ResumeAction>;
}

export default function SkillsForm({ resume, dispatch }: SkillsFormProps) {
  const groups = resume.skills.groups;
  const projects = resume.projects || [];
  const certs = resume.certifications || [];

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Skills, Summary &amp; More
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Add your skills, professional summary, certifications, and projects.
      </p>

      {/* ── Professional Summary ── */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Professional Summary
        </label>
        <textarea
          value={resume.summary || ""}
          onChange={(e) => dispatch({ type: "SET_SUMMARY", summary: e.target.value })}
          placeholder="Write a brief professional summary highlighting your key qualifications and career objectives..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* ── Skill Groups ── */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Skills
        </label>
        <p className="mb-3 text-xs text-gray-400">
          Group skills by category (e.g. &quot;Programming Languages&quot;, &quot;Tools&quot;). Separate items with commas.
        </p>

        <div className="space-y-3">
          {groups.map((group, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-start"
            >
              <input
                type="text"
                value={group.label}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SKILL_GROUP",
                    index: i,
                    group: { ...group, label: e.target.value },
                  })
                }
                placeholder="Category name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-40"
              />
              <input
                type="text"
                value={group.items.join(", ")}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SKILL_GROUP",
                    index: i,
                    group: {
                      ...group,
                      items: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    dispatch({ type: "ADD_SKILL_GROUP" });
                  }
                }}
                placeholder="e.g. Python, JavaScript, TypeScript"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => dispatch({ type: "REMOVE_SKILL_GROUP", index: i })}
                className="self-start rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Remove skill group"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: "ADD_SKILL_GROUP" })}
          className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add skill group
        </button>
      </div>

      {/* ── Certifications ── */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Certifications
        </label>
        <p className="mb-2 text-xs text-gray-400">
          One certification per line.
        </p>
        {certs.map((cert, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={cert}
              onChange={(e) => {
                const updated = [...certs];
                updated[i] = e.target.value;
                dispatch({ type: "SET_CERTIFICATIONS", certs: updated });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  dispatch({ type: "SET_CERTIFICATIONS", certs: [...certs, ""] });
                }
              }}
              placeholder="e.g. AWS Solutions Architect"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                dispatch({
                  type: "SET_CERTIFICATIONS",
                  certs: certs.filter((_, j) => j !== i),
                });
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Remove certification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            dispatch({ type: "SET_CERTIFICATIONS", certs: [...certs, ""] })
          }
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add certification
        </button>
      </div>

      {/* ── Projects ── */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Projects
        </label>
        <p className="mb-3 text-xs text-gray-400">
          Personal or professional projects that showcase your skills.
        </p>

        <div className="space-y-4">
          {projects.map((project, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Project {i + 1}
                </h3>
                <button
                  onClick={() => dispatch({ type: "REMOVE_PROJECT", index: i })}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove project"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_PROJECT",
                        index: i,
                        project: { ...project, name: e.target.value },
                      })
                    }
                    placeholder="e.g. Open Source CLI Tool"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Description / Bullets
                  </label>
                  {project.bullets.map((bullet, j) => (
                    <div key={j} className="mb-2 flex items-start gap-2">
                      <span className="mt-2.5 text-xs text-gray-400">&bull;</span>
                      <textarea
                        value={bullet}
                        onChange={(e) => {
                          const updated: DocProject = {
                            ...project,
                            bullets: project.bullets.map((b, bi) =>
                              bi === j ? e.target.value : b,
                            ),
                          };
                          dispatch({ type: "UPDATE_PROJECT", index: i, project: updated });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const updated: DocProject = {
                              ...project,
                              bullets: [...project.bullets, ""],
                            };
                            dispatch({ type: "UPDATE_PROJECT", index: i, project: updated });
                          }
                        }}
                        placeholder="Describe what you built or achieved..."
                        rows={2}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {project.bullets.length > 1 && (
                        <button
                          onClick={() => {
                            const updated: DocProject = {
                              ...project,
                              bullets: project.bullets.filter((_, bi) => bi !== j),
                            };
                            dispatch({ type: "UPDATE_PROJECT", index: i, project: updated });
                          }}
                          className="mt-1.5 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove bullet"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const updated: DocProject = {
                        ...project,
                        bullets: [...project.bullets, ""],
                      };
                      dispatch({ type: "UPDATE_PROJECT", index: i, project: updated });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add bullet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: "ADD_PROJECT" })}
          className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add project
        </button>
      </div>
    </div>
  );
}
