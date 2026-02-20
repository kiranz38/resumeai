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

  return (
    <div className="mt-8 flex items-center justify-center gap-6 sm:mt-10">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">
          {count.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">Resumes analyzed</p>
      </div>
      <div className="h-8 w-px bg-gray-200" />
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">30 sec</p>
        <p className="text-xs text-gray-500">Average analysis time</p>
      </div>
      <div className="h-8 w-px bg-gray-200" />
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">4.8/5</p>
        <p className="text-xs text-gray-500">User satisfaction</p>
      </div>
    </div>
  );
}
