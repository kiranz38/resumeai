"use client";

import { useEffect, useState } from "react";
import { loadJobSessions, type JobSession } from "@/lib/job-sessions";

interface DashboardSidebarProps {
  activeNav: "dashboard" | "jobs";
  onNavChange: (nav: "dashboard" | "jobs") => void;
  onQuickAnalyze: () => void;
}

export default function DashboardSidebar({
  activeNav,
  onNavChange,
  onQuickAnalyze,
}: DashboardSidebarProps) {
  const [sessions, setSessions] = useState<JobSession[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setSessions(loadJobSessions());
  }, []);

  return (
    <>
      {/* Mobile toggle — small pill instead of floating box */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed left-2 top-[4.5rem] z-40 rounded-full border border-gray-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
        </svg>
      </button>

      <aside
        className={`fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:relative lg:top-0 lg:h-auto lg:translate-x-0 ${
          collapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-2 p-4">
          {/* Quick Analyze CTA */}
          <button
            onClick={onQuickAnalyze}
            className="flex w-full items-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Analyze
          </button>

          {/* Nav items */}
          <nav className="mt-2 flex flex-col gap-1">
            <button
              onClick={() => onNavChange("dashboard")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeNav === "dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => onNavChange("jobs")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeNav === "jobs"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Job Board
            </button>
          </nav>
        </div>

        {/* Recent analyses */}
        {sessions.length > 0 && (
          <div className="mt-2 border-t border-gray-100 px-4 py-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Recent Analyses
            </h4>
            <div className="flex flex-col gap-1.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-700">
                      {s.jobTitle}
                    </p>
                    {s.company && (
                      <p className="truncate text-xs text-gray-400">
                        {s.company}
                      </p>
                    )}
                  </div>
                  <span
                    className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.radarBefore >= 70
                        ? "bg-green-50 text-green-700"
                        : s.radarBefore >= 40
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {s.radarBefore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy note at bottom */}
        <div className="mt-auto border-t border-gray-100 p-4">
          <p className="text-xs text-gray-400">
            Your data stays in your browser. Nothing stored on our servers.
          </p>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
