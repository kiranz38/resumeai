"use client";

import { useEffect, useState } from "react";

interface Stats {
  events: Record<string, number>;
  hourly: Record<string, number>;
  gateway: {
    circuitOpen: boolean;
    activeRequests: number;
    recentFailures: number;
    openedAt: number | null;
  };
  uptime: number;
}

/** Funnel stages in order — maps event names to display labels */
const FUNNEL_STAGES: [string, string][] = [
  ["analysis_completed", "Free Analysis"],
  ["pro_generation_started", "Pro Generation Started"],
  ["pro_generation_completed", "Pro Generation Completed"],
  ["checkout_started", "Checkout Started"],
  ["pack_generation_started", "Pack Generation Started"],
  ["pack_generation_completed", "Pack Generation Completed"],
  ["fallback_used", "Fallback Used"],
  ["send_report_email_sent", "Report Email Sent"],
];

export default function AdminFunnelPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loaded, setLoaded] = useState(false);

  const fetchStats = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStats(await res.json());
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats.");
    }
  };

  // Auto-refresh every 30s once loaded
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, token]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Funnel</h1>

      {!loaded && (
        <div className="mb-8 flex gap-3">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin secret"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && fetchStats()}
          />
          <button
            onClick={fetchStats}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Load
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Gateway health */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Gateway Health</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-gray-500">Circuit</div>
                <div className={`font-mono font-bold ${stats.gateway.circuitOpen ? "text-red-600" : "text-green-600"}`}>
                  {stats.gateway.circuitOpen ? "OPEN" : "CLOSED"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Active LLM</div>
                <div className="font-mono font-bold text-gray-900">{stats.gateway.activeRequests}</div>
              </div>
              <div>
                <div className="text-gray-500">Recent Failures</div>
                <div className="font-mono font-bold text-gray-900">{stats.gateway.recentFailures}</div>
              </div>
              <div>
                <div className="text-gray-500">Uptime</div>
                <div className="font-mono font-bold text-gray-900">{formatUptime(stats.uptime)}</div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Conversion Funnel</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 font-medium">Stage</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                  <th className="pb-2 text-right font-medium">Last Hour</th>
                </tr>
              </thead>
              <tbody>
                {FUNNEL_STAGES.map(([key, label]) => (
                  <tr key={key} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{label}</td>
                    <td className="py-2 text-right font-mono text-gray-900">
                      {stats.events[key] ?? 0}
                    </td>
                    <td className="py-2 text-right font-mono text-gray-600">
                      {stats.hourly[key] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw events */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              All raw event counts
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
              {JSON.stringify(stats.events, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
