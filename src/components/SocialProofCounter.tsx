"use client";

import { useEffect, useState } from "react";

/**
 * Dynamic social proof counter that starts at a base number
 * and periodically increments to create a "live" feeling.
 */
export default function SocialProofCounter() {
  // Base: seeded from today's date so it looks consistent per-day
  const getBaseCount = () => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    return 10247 + dayOfYear * 14; // ~14 new per day from Jan 1
  };

  const [count, setCount] = useState(getBaseCount);

  useEffect(() => {
    // Increment by 1 every 8-15 seconds (random interval)
    const tick = () => {
      setCount((c) => c + 1);
      const next = 8000 + Math.random() * 7000;
      timer = setTimeout(tick, next);
    };
    let timer = setTimeout(tick, 5000 + Math.random() * 5000);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      value: count.toLocaleString(),
      label: "Resumes analyzed",
      icon: (
        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      value: "30 sec",
      label: "Avg. analysis time",
      icon: (
        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: "4.8/5",
      label: "User satisfaction",
      icon: (
        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-4 mx-auto max-w-md sm:max-w-lg">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white/80 px-3 py-3.5 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            {stat.icon}
          </div>
          <p className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">
            {stat.value}
          </p>
          <p className="text-[10px] font-medium leading-tight text-gray-500 sm:text-xs">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
