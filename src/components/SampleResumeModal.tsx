"use client";

import { useState, useCallback } from "react";
import { DEMO_RESULT, DEMO_RESUME_TEXT, DEMO_JD_TEXT } from "@/lib/demo-data";
import { trackEvent } from "@/lib/analytics";

export default function SampleResumeModal() {
  const [open, setOpen] = useState(false);

  const handleConfirm = useCallback(() => {
    trackEvent("sample_resume_clicked", { page_name: "landing" });
    sessionStorage.setItem("rt_demo", JSON.stringify(DEMO_RESULT));
    sessionStorage.setItem("rt_resume_text", DEMO_RESUME_TEXT);
    sessionStorage.setItem("rt_jd_text", DEMO_JD_TEXT);
    window.location.href = "/results";
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 sm:gap-2 sm:rounded-full sm:border sm:border-white/40 sm:bg-white/40 sm:px-5 sm:py-2 sm:text-gray-600 sm:shadow-sm sm:shadow-black/5 sm:ring-1 sm:ring-black/5 sm:backdrop-blur-md sm:hover:bg-white/70 sm:hover:text-gray-900"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Try sample resume
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Try a sample resume</h3>
            <p className="mt-2 text-sm text-gray-600">
              See how ResumeMate AI works using a sample resume
              (<span className="font-medium">Sarah Chen, Senior Software Engineer</span>)
              matched against a Full-Stack Engineer role at CloudScale Inc.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                See sample results
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
