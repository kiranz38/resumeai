export const SITE_NAME = "ResumeMate AI";
export const SITE_URL = "https://resumemate.ai";
export const SITE_DESCRIPTION =
  "See what's blocking callbacks — then fix it in minutes. Get your Hiring Manager Radar Score, missing keywords, and a tailored rewrite pack.";

export const TRIAL_PRICE = 1.50;
export const TRIAL_PRICE_DISPLAY = "$1.50";
export const PRO_PRICE = 5;
export const PRO_PRICE_DISPLAY = "$5";
export const CAREER_PASS_PRICE = 10;
export const CAREER_PASS_DISPLAY = "$10";

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

export const APPLY_PACK_5_PRICE = 19.99;
export const APPLY_PACK_5_DISPLAY = "$19.99";
export const APPLY_PACK_10_PRICE = 34.99;
export const APPLY_PACK_10_DISPLAY = "$34.99";

export const JOB_BOARD_COUNTRIES = [
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "au", label: "Australia" },
  { code: "de", label: "Germany" },
  { code: "in", label: "India" },
  { code: "fr", label: "France" },
  { code: "nl", label: "Netherlands" },
  { code: "sg", label: "Singapore" },
  { code: "", label: "Remote / Anywhere" },
] as const;

export const LEGAL_DISCLAIMER =
  "General guidance only. Not career advice. Results may be inaccurate. Do not rely on this tool as your sole decision-maker.";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/create", label: "Create" },
  { href: "/analyze?tab=jobs", label: "Job Board" },
  { href: "/career", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How It Works" },
] as const;
