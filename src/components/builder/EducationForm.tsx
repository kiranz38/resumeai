"use client";

import type { Dispatch } from "react";
import type { DocResume, DocEducation } from "@/lib/pro-document";
import type { ResumeAction } from "@/lib/resume-reducer";

interface EducationFormProps {
  resume: DocResume;
  dispatch: Dispatch<ResumeAction>;
}

export default function EducationForm({ resume, dispatch }: EducationFormProps) {
  const education = resume.education || [];

  const updateField = (index: number, field: keyof DocEducation, value: string) => {
    const edu = { ...education[index], [field]: value };
    dispatch({ type: "UPDATE_EDUCATION", index, edu });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Education</h2>
      <p className="mb-6 text-sm text-gray-500">
        Add your degrees, certifications, or relevant coursework.
      </p>

      <div className="space-y-4">
        {education.map((edu, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Education {i + 1}
              </h3>
              <button
                onClick={() => dispatch({ type: "REMOVE_EDUCATION", index: i })}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Remove education"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    School / University
                  </label>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => updateField(i, "school", e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={edu.degree || ""}
                    onChange={(e) => updateField(i, "degree", e.target.value)}
                    placeholder="e.g. B.S. Computer Science"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Start Year
                  </label>
                  <input
                    type="text"
                    value={edu.start || ""}
                    onChange={(e) => updateField(i, "start", e.target.value)}
                    placeholder="e.g. 2018"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    End Year
                  </label>
                  <input
                    type="text"
                    value={edu.end || ""}
                    onChange={(e) => updateField(i, "end", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        dispatch({ type: "ADD_EDUCATION" });
                      }
                    }}
                    placeholder="e.g. 2022"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: "ADD_EDUCATION" })}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add education
      </button>
    </div>
  );
}
