"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Sticky bottom CTA bar that appears on mobile after scrolling past the hero.
 * Research: +69% mobile conversion uplift (AB Tasty study).
 */
export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling 500px (past the hero section)
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:hidden">
      <Link
        href="/analyze?action=upload"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Optimize My Resume Free
      </Link>
    </div>
  );
}
