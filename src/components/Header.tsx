"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";

function isActive(linkHref: string, pathname: string, searchParams: URLSearchParams): boolean {
  if (linkHref === "/") return pathname === "/";
  const [base, query] = linkHref.split("?");
  if (query) {
    // Link has query params (e.g. /analyze?tab=jobs) — only active on exact match
    const linkParams = new URLSearchParams(query);
    if (pathname !== base) return false;
    for (const [key, val] of linkParams) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  }
  // Plain path link (e.g. /analyze) — active when path matches but NOT when a sibling query link matches
  // e.g. /analyze is active at /analyze but not at /analyze?tab=jobs
  if (pathname !== base && !pathname.startsWith(base + "/")) return false;
  // Check if any NAV_LINK with query params on same base is a better match
  const hasQueryMatch = NAV_LINKS.some((other) => {
    if (!other.href.includes("?")) return false;
    const [otherBase, otherQuery] = other.href.split("?");
    if (otherBase !== base) return false;
    const otherParams = new URLSearchParams(otherQuery);
    for (const [key, val] of otherParams) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  });
  return !hasQueryMatch;
}

export default function Header() {
  return (
    <Suspense fallback={<HeaderShell />}>
      <HeaderInner />
    </Suspense>
  );
}

/** Static shell rendered while searchParams resolve */
function HeaderShell() {
  return (
    <header className="bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-caveat)] text-2xl font-bold text-white/90 tracking-wide">Resume Mate</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/50 uppercase tracking-wider">AI</span>
        </Link>
      </div>
    </header>
  );
}

function HeaderInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <header className="bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-caveat)] text-2xl font-bold text-white/90 tracking-wide">
            Resume Mate
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/50 uppercase tracking-wider">
            AI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, pathname, searchParams);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-gray-800 px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, pathname, searchParams);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
