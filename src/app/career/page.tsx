"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadJobSessions, type JobSession } from "@/lib/job-sessions";
import { trackEvent } from "@/lib/analytics";

interface PassStatus {
  plan: string;
  quotaRemaining: number;
  quotaTotal: number;
  expiresAt: number;
  daysLeft: number;
}

function getPassStatus(): PassStatus | null {
  try {
    const token = sessionStorage.getItem("rt_entitlement_token");
    const plan = sessionStorage.getItem("rt_entitlement_plan");
    if (!token || plan !== "pass") return null;

    // Decode token payload (base64url.sig)
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const payload = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));

    const now = Date.now();
    if (payload.expiresAt && now > payload.expiresAt) return null;

    const daysLeft = payload.expiresAt
      ? Math.max(0, Math.ceil((payload.expiresAt - now) / (24 * 60 * 60 * 1000)))
      : 30;

    return {
      plan: payload.plan || "pass",
      quotaRemaining: payload.quotaRemaining ?? 50,
      quotaTotal: payload.quotaTotal ?? 50,
      expiresAt: payload.expiresAt || 0,
      daysLeft,
    };
  } catch {
    return null;
  }
}

export default function CareerDashboardPage() {
  const [passStatus, setPassStatus] = useState<PassStatus | null>(null);
  const [sessions, setSessions] = useState<JobSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = getPassStatus();
    setPassStatus(status);

    const jobSessions = loadJobSessions();
    setSessions(jobSessions);

    setLoading(false);
    trackEvent("career_dashboard_viewed");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your job applications and optimization history.
          </p>
        </div>
        <Link
          href="/analyze"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Optimize new role
        </Link>
      </div>

      {/* Pass Status Card */}
      {passStatus ? (
        <div className="mb-8 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                Career Pass Active
              </span>
              <p className="mt-2 text-sm text-gray-600">
                {passStatus.daysLeft} days remaining
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{passStatus.quotaRemaining}</p>
                <p className="text-xs text-gray-500">jobs left</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{passStatus.quotaTotal - passStatus.quotaRemaining}</p>
                <p className="text-xs text-gray-500">jobs used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{passStatus.daysLeft}</p>
                <p className="text-xs text-gray-500">days left</p>
              </div>
            </div>
          </div>

          {/* Quota bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Quota used</span>
              <span>{passStatus.quotaTotal - passStatus.quotaRemaining} / {passStatus.quotaTotal}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${((passStatus.quotaTotal - passStatus.quotaRemaining) / passStatus.quotaTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            No active Career Pass.{" "}
            <Link href="/pricing" className="font-semibold text-indigo-600 hover:underline">
              Get Career Pass
            </Link>{" "}
            for 50 job analyses over 30 days.
          </p>
        </div>
      )}

      {/* Job History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Job History ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">No job analyses yet.</p>
            <Link
              href="/analyze"
              className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
            >
              Analyze your first resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {session.jobTitle}
                  </p>
                  {session.company && (
                    <p className="text-xs text-gray-500">{session.company}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Radar scores */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        session.radarBefore >= 75
                          ? "bg-green-100 text-green-700"
                          : session.radarBefore >= 60
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {session.radarBefore}
                    </span>
                    {session.radarAfter != null && (
                      <>
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          {session.radarAfter}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      session.radarAfter != null
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {session.radarAfter != null ? "Pro" : "Free"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/analyze"
          className="rounded-xl border border-gray-200 bg-white p-5 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
        >
          <p className="font-semibold text-gray-900">New Analysis</p>
          <p className="mt-1 text-xs text-gray-500">Optimize for a new role</p>
        </Link>
        <Link
          href="/analyze?tab=jobs"
          className="rounded-xl border border-gray-200 bg-white p-5 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
        >
          <p className="font-semibold text-gray-900">Job Board</p>
          <p className="mt-1 text-xs text-gray-500">Browse real listings</p>
        </Link>
        <Link
          href="/results/pro"
          className="rounded-xl border border-gray-200 bg-white p-5 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
        >
          <p className="font-semibold text-gray-900">Last Pro Report</p>
          <p className="mt-1 text-xs text-gray-500">View your latest results</p>
        </Link>
      </div>
    </div>
  );
}
