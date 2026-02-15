"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { CAREER_PASS_DISPLAY } from "@/lib/constants";

export default function CareerWelcomeWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <CareerWelcomePage />
    </Suspense>
  );
}

function CareerWelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<string>("pass");

  useEffect(() => {
    // Handle dev_token from checkout redirect
    const devToken = searchParams.get("dev_token");
    const planParam = searchParams.get("plan");
    if (devToken) {
      sessionStorage.setItem("rt_entitlement_token", devToken);
      sessionStorage.setItem("rt_entitlement_plan", planParam || "pass");
    }

    // Handle Stripe session_id
    const sessionId = searchParams.get("session_id");
    if (sessionId && !devToken) {
      fetch("/api/entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, plan: planParam || "pass" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.token) {
            sessionStorage.setItem("rt_entitlement_token", data.token);
            sessionStorage.setItem("rt_entitlement_plan", data.claims?.plan || "pass");
          }
        })
        .catch(() => {});
    }

    setPlan(planParam || sessionStorage.getItem("rt_entitlement_plan") || "pass");
    setReady(true);
    trackEvent("career_pass_welcome_viewed");
  }, [searchParams]);

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">
        Welcome to Career Pass!
      </h1>
      <p className="mt-3 text-lg text-gray-600">
        Your {CAREER_PASS_DISPLAY} Career Pass is active. You have 30 days and up to 50 job analyses.
      </p>

      <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 text-left">
        <h2 className="mb-4 font-semibold text-gray-900">What you can do now:</h2>
        <ul className="space-y-3">
          {[
            { text: "Analyze any resume + job description", link: "/analyze" },
            { text: "Get full Pro reports with tailored rewrites", link: null },
            { text: "Use the Bulk CV Generator for multiple roles", link: "/analyze?tab=jobs" },
            { text: "Download PDF, DOCX, and TXT exports", link: null },
            { text: "Track your progress in the Career Dashboard", link: "/career" },
          ].map((item) => (
            <li key={item.text} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-0.5 text-indigo-500">&#10003;</span>
              {item.link ? (
                <Link href={item.link} className="hover:text-indigo-600 hover:underline">
                  {item.text}
                </Link>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Start optimizing a resume
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <Link
          href="/career"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
        >
          Go to Dashboard
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Your pass expires 30 days from purchase. Unused quota does not roll over.
      </p>
    </div>
  );
}
