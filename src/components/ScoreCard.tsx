"use client";

import { useEffect, useState } from "react";
import type { RadarLabel } from "@/lib/types";

interface ScoreCardProps {
  label: string;
  score: number;
  description: string;
  variant?: "default" | "primary" | "breakdown";
  radarLabel?: RadarLabel;
}

function getScoreColor(score: number): { bg: string; text: string; ring: string; fill: string } {
  if (score >= 75) return { bg: "bg-green-50", text: "text-green-700", ring: "stroke-green-500", fill: "bg-green-500" };
  if (score >= 60) return { bg: "bg-blue-50", text: "text-blue-700", ring: "stroke-blue-500", fill: "bg-blue-500" };
  return { bg: "bg-yellow-50", text: "text-yellow-700", ring: "stroke-yellow-500", fill: "bg-yellow-500" };
}

/** Animate from 0 → target over `duration` ms with ease-out cubic. */
function useCountUp(target: number, duration = 1500): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = performance.now();

    let raf: number;
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

export default function ScoreCard({ label, score, description, variant = "default", radarLabel }: ScoreCardProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const colors = getScoreColor(clampedScore);
  const animatedScore = useCountUp(clampedScore);

  // ── Primary variant: Large gauge with radar label ──
  if (variant === "primary") {
    const radius = 50;
    const circumference = Math.PI * radius; // semicircle
    const offset = circumference - (clampedScore / 100) * circumference;

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <div className="relative mx-auto h-28 w-44">
          <svg className="h-28 w-44" viewBox="0 0 120 70">
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              className={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className={`text-4xl font-bold ${colors.text}`}>{animatedScore}</span>
          </div>
        </div>
        {radarLabel && (
          <p className={`mt-1 text-sm font-semibold ${colors.text}`}>{radarLabel}</p>
        )}
        <h3 className="mt-2 text-base font-semibold text-gray-900">{label}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
    );
  }

  // ── Breakdown variant: Horizontal bar ──
  if (variant === "breakdown") {
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="w-28 shrink-0 text-sm font-medium text-gray-700">{label}</span>
        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.fill} transition-all duration-700 ease-out`}
            style={{ width: `${clampedScore}%` }}
          />
        </div>
        <span className={`w-8 text-right text-sm font-bold ${colors.text}`}>{animatedScore}</span>
      </div>
    );
  }

  // ── Default variant: Circle + text (original) ──
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const circOffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={`rounded-xl border border-gray-200 ${colors.bg} p-5`}>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              className={colors.ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circOffset}
              style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${colors.text}`}>{animatedScore}</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
