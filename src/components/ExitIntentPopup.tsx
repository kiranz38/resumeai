"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface ExitIntentPopupProps {
  score?: number;
  missingKeywords?: number;
}

/**
 * Detects exit intent (mouse moves toward top of viewport) and shows
 * a recovery popup with the user's score. Shows only once per session.
 * Research: exit-intent popups recover 3-17% of abandoning visitors.
 */
export default function ExitIntentPopup({ score, missingKeywords }: ExitIntentPopupProps) {
  const [show, setShow] = useState(false);

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      // Only trigger when mouse leaves toward the top of the page
      if (e.clientY > 10) return;
      // Only show once per session
      if (sessionStorage.getItem("rt_exit_popup_shown")) return;

      sessionStorage.setItem("rt_exit_popup_shown", "true");
      setShow(true);
      trackEvent("exit_intent_popup_shown", { score: score ?? 0 });
    },
    [score]
  );

  useEffect(() => {
    // Don't show on mobile (no mouse)
    if (window.matchMedia("(pointer: coarse)").matches) return;
    // Don't show if already shown
    if (sessionStorage.getItem("rt_exit_popup_shown")) return;

    // Delay binding to avoid false triggers on page load
    const timer = setTimeout(() => {
      document.addEventListener("mouseout", handleMouseOut);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [handleMouseOut]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Wait — don&apos;t leave with a weak resume</h3>

          {score != null && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2">
              <span className="text-sm text-gray-600">Your score:</span>
              <span className={`text-2xl font-bold ${
                score >= 75 ? "text-green-600" : score >= 60 ? "text-blue-600" : "text-red-600"
              }`}>
                {score}
              </span>
              <span className="text-sm text-gray-500">/ 100</span>
            </div>
          )}

          <p className="mt-4 text-sm text-gray-600">
            {missingKeywords && missingKeywords > 0
              ? `You're missing ${missingKeywords} critical keywords. Every application you send without fixing this is an interview you'll never get.`
              : "Every application with an unoptimized resume is an interview you'll never get."
            }
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="#pro-upgrade"
              onClick={() => {
                setShow(false);
                trackEvent("exit_intent_cta_clicked");
                document.getElementById("pro-upgrade")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
            >
              Fix My Resume Now — Free
            </Link>
            <button
              onClick={() => setShow(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              No thanks, I&apos;ll keep my current resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
