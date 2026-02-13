"use client";

import { useEffect } from "react";
import { DEMO_RESULT, DEMO_RESUME_TEXT, DEMO_JD_TEXT } from "@/lib/demo-data";
import { trackEvent } from "@/lib/analytics";

export default function DemoPage() {
  useEffect(() => {
    trackEvent("demo_clicked");
    // Store demo data in sessionStorage, then hard-navigate
    sessionStorage.setItem("rt_demo", JSON.stringify(DEMO_RESULT));
    sessionStorage.setItem("rt_resume_text", DEMO_RESUME_TEXT);
    sessionStorage.setItem("rt_jd_text", DEMO_JD_TEXT);
    // Use window.location for a hard nav so the results page
    // reads sessionStorage on a fresh mount (no race condition)
    window.location.href = "/results";
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Loading demo results...</p>
      </div>
    </div>
  );
}
