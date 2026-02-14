export const SITE_NAME = "ResumeMate AI";
export const SITE_URL = "https://resumemate.ai";
export const SITE_DESCRIPTION =
  "See what's blocking callbacks — then fix it in minutes. Get your Hiring Manager Radar Score, missing keywords, and a tailored rewrite pack.";

export const PRO_PRICE = 7.99;
export const PRO_PRICE_DISPLAY = "$7.99";
export const CAREER_PASS_PRICE = 19;
export const CAREER_PASS_DISPLAY = "$19";

export const PRICE_VARIANT = parseInt(
  process.env.NEXT_PUBLIC_PRICE_VARIANT || "8",
  10
);
export const PRICE_DISPLAY = PRO_PRICE_DISPLAY;

export const ENABLE_JD_URL =
  process.env.NEXT_PUBLIC_ENABLE_JD_URL === "true";

export const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior", "Manager"] as const;
export type Seniority = (typeof SENIORITY_OPTIONS)[number];

export const REGION_OPTIONS = ["US", "AU", "UK"] as const;
export type Region = (typeof REGION_OPTIONS)[number];

export const LEGAL_DISCLAIMER =
  "General guidance only. Not career advice. Results may be inaccurate. Do not rely on this tool as your sole decision-maker.";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How It Works" },
] as const;
