"use client";

import type { Dispatch } from "react";
import type { DocResume, DocExperience } from "@/lib/pro-document";
import type { ResumeAction } from "@/lib/resume-reducer";

interface ExperienceFormProps {
  resume: DocResume;
  dispatch: Dispatch<ResumeAction>;
}

export default function ExperienceForm({ resume, dispatch }: ExperienceFormProps) {
  const experiences = resume.experience;

  const updateField = (index: number, field: keyof DocExperience, value: string) => {
    const exp = { ...experiences[index], [field]: value };
    dispatch({ type: "UPDATE_EXPERIENCE", index, exp });
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const exp = { ...experiences[expIndex] };
    const bullets = [...exp.bullets];
    bullets[bulletIndex] = value;
    exp.bullets = bullets;
    dispatch({ type: "UPDATE_EXPERIENCE", index: expIndex, exp });
  };

  const addBullet = (expIndex: number) => {
    const exp = { ...experiences[expIndex] };
    exp.bullets = [...exp.bullets, ""];
    dispatch({ type: "UPDATE_EXPERIENCE", index: expIndex, exp });
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const exp = { ...experiences[expIndex] };
    exp.bullets = exp.bullets.filter((_, i) => i !== bulletIndex);
    dispatch({ type: "UPDATE_EXPERIENCE", index: expIndex, exp });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Work Experience
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Add your work history, starting with the most recent position.
      </p>

      <div className="space-y-6">
        {experiences.map((exp, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Position {i + 1}
              </h3>
              <button
                onClick={() => dispatch({ type: "REMOVE_EXPERIENCE", index: i })}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Remove position"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Company + Title */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateField(i, "company", e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Job Title</label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateField(i, "title", e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Location + Dates */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
                  <input
                    type="text"
                    value={exp.location || ""}
                    onChange={(e) => updateField(i, "location", e.target.value)}
                    placeholder="e.g. Remote"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Start Date</label>
                  <input
                    type="text"
                    value={exp.start || ""}
                    onChange={(e) => updateField(i, "start", e.target.value)}
                    placeholder="e.g. Jan 2022"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">End Date</label>
                  <input
                    type="text"
                    value={exp.end || ""}
                    onChange={(e) => updateField(i, "end", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        // Focus moves to bullets, don't auto-add position here
                      }
                    }}
                    placeholder="e.g. Present"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bullets */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Accomplishments / Responsibilities
                </label>
                {exp.bullets.map((bullet, j) => (
                  <div key={j} className="mb-2 flex items-start gap-2">
                    <span className="mt-2.5 text-xs text-gray-400">&bull;</span>
                    <textarea
                      value={bullet}
                      onChange={(e) => updateBullet(i, j, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addBullet(i);
                        }
                      }}
                      placeholder="Describe an accomplishment or responsibility..."
                      rows={2}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {exp.bullets.length > 1 && (
                      <button
                        onClick={() => removeBullet(i, j)}
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
                  onClick={() => addBullet(i)}
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
        onClick={() => dispatch({ type: "ADD_EXPERIENCE" })}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add another position
      </button>
    </div>
  );
}
