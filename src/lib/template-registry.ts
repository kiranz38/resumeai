/**
 * Template registry: metadata + lazy-loaded components for all resume templates.
 * Only the selected template's JS bundle is loaded at runtime.
 */

import { lazy, type ComponentType } from "react";
import type { DocResume } from "./pro-document";

export interface TemplateEntry {
  id: string;
  name: string;
  description: string;
  component: React.LazyExoticComponent<ComponentType<{ resume: DocResume }>>;
}

export const TEMPLATES: TemplateEntry[] = [
  {
    id: "modern-ats",
    name: "Modern ATS",
    description: "Single-column, clean layout optimized for applicant tracking systems.",
    component: lazy(() => import("@/components/templates/ModernAtsResume")),
  },
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional serif styling with ruled sections for formal industries.",
    component: lazy(() => import("@/components/templates/ClassicProfessional")),
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Generous whitespace with clean sans-serif type for tech and design roles.",
    component: lazy(() => import("@/components/templates/Minimalist")),
  },
  {
    id: "two-column",
    name: "Two-Column",
    description: "Sidebar for skills and contact, main column for experience.",
    component: lazy(() => import("@/components/templates/TwoColumn")),
  },
  {
    id: "executive",
    name: "Executive",
    description: "Bold header with centered name in serif for senior leadership roles.",
    component: lazy(() => import("@/components/templates/Executive")),
  },
  {
    id: "creative",
    name: "Creative",
    description: "Accent color bar with modern typography for marketing and design roles.",
    component: lazy(() => import("@/components/templates/Creative")),
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tight spacing and small margins to fit more content on one page.",
    component: lazy(() => import("@/components/templates/Compact")),
  },
  {
    id: "simple-clean",
    name: "Simple Clean",
    description: "No lines or dividers — maximum ATS safety for government and corporate roles.",
    component: lazy(() => import("@/components/templates/SimpleClean")),
  },
];

export function getTemplate(id: string): TemplateEntry | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
