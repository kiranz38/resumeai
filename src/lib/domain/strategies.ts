/**
 * RewriteStrategy implementations for 5 job families.
 *
 * Each strategy changes phrasing and metric types — NOT skills injection.
 * Skills may only come from what the candidate already has or what
 * appears in the JobProfile.
 *
 * Maps:
 *  engineering -> EngineeringStrategy
 *  business (ops/product/healthcare/education/general) -> BusinessStrategy
 *  sales -> SalesStrategy
 *  marketing -> MarketingStrategy
 *  finance -> FinanceStrategy
 */

import type {
  RewriteStrategy,
  BulletSignals,
  MetricHeuristic,
  SummaryParams,
  CoverLetterParams,
  JobFamily,
} from "./types";
import { familyToStrategyKey } from "./jobFamilies";

// ── Shared verb replacement map (weak → strong) ──

const BASE_VERB_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^Responsible for\s+/i, "Led "],
  [/^Helped\s+/i, "Collaborated to "],
  [/^Assisted\s+(with\s+)?/i, "Supported "],
  [/^Worked on\s+/i, "Delivered "],
  [/^Participated in\s+/i, "Contributed to "],
  [/^Involved in\s+/i, "Drove "],
  [/^Was part of\s+/i, "Collaborated on "],
  [/^Made\s+/i, "Produced "],
  [/^Used\s+/i, "Applied "],
  [/^Tasked with\s+/i, "Executed "],
  [/^Handled\s+/i, "Managed "],
  [/^Dealt with\s+/i, "Resolved "],
];

// ── Shared helper: apply verb replacement ──

function applyVerbReplacement(
  bullet: string,
  replacements: Array<[RegExp, string]>,
): string {
  let result = bullet;
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }
  // Capitalize first letter
  if (/^[a-z]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  // Ensure ends with period
  if (result.length > 0 && !/[.!?]$/.test(result.trim())) {
    result = result.trim() + ".";
  }
  return result;
}

// ── Shared helper: draft cover letter body ──

function baseCoverLetter(params: CoverLetterParams, domainPhrase: string): string[] {
  const { name, title, company, topSkills, recentRole, topBullet, years, responsibilities } = params;

  const greeting = "Dear Hiring Manager,";

  const body1 = `With ${years}+ years of experience in ${domainPhrase} and a strong background in ${topSkills}, I am applying for the ${title} position at ${company}. In ${recentRole}, I ${topBullet.charAt(0).toLowerCase()}${topBullet.slice(1).replace(/\.$/, "")}, which demonstrates my ability to deliver meaningful outcomes.`;

  const body2 = responsibilities.length > 0
    ? `My experience aligns well with your team's focus on ${responsibilities[0].toLowerCase().replace(/\.$/, "")}. I bring a track record of delivering results and collaborating effectively to meet organizational goals.`
    : `I bring a track record of delivering results and collaborating effectively with teams to meet organizational goals.`;

  const closing = `Thank you for considering my application.\n\nBest regards,\n${name}`;

  return [greeting, body1, body2, closing];
}

// ══════════════════════════════════════════════
// 1) Engineering Strategy (software/IT)
// ══════════════════════════════════════════════

const engineeringStrategy: RewriteStrategy = {
  family: "engineering",

  preferredVerbs: [
    "Architected", "Built", "Designed", "Deployed", "Developed",
    "Engineered", "Implemented", "Migrated", "Optimized", "Scaled",
    "Shipped", "Automated", "Refactored", "Integrated", "Configured",
  ],

  metricHeuristics: [
    {
      detectPattern: /\d+\s*%/,
      templates: [
        "reducing latency by ~{n}%",
        "improving test coverage by ~{n}%",
        "decreasing build time by ~{n}%",
        "reducing error rate by ~{n}%",
      ],
    },
    {
      detectPattern: /\d+[xX]/,
      templates: [
        "achieving ~{n}x throughput improvement",
      ],
    },
    {
      detectPattern: /\d+\s*(users?|customers?)/i,
      templates: [
        "serving ~{n} active users",
      ],
    },
  ],

  verbReplacements: [
    ...BASE_VERB_REPLACEMENTS,
    [/^Created\s+/i, "Designed and implemented "],
    [/^Built\s+/i, "Architected and built "],
    [/^Managed\s+/i, "Led and managed "],
  ],

  rewriteBullet(bullet: string, signals: BulletSignals): string {
    return applyVerbReplacement(bullet, this.verbReplacements);
  },

  draftSummary(params: SummaryParams): string {
    const { headline, years, skills } = params;
    const skillList = skills.slice(0, 5).join(", ");
    const yearsStr = years > 0 ? `${years}+` : "";
    return `${headline} with ${yearsStr} years of experience building scalable applications and leading technical initiatives. Skilled in ${skillList}. Proven track record of delivering high-quality software solutions aligned with business goals.`;
  },

  draftCoverLetter(params: CoverLetterParams): string[] {
    return baseCoverLetter(params, "software development");
  },
};

// ══════════════════════════════════════════════
// 2) Business Strategy (ops/product/PM/general)
// ══════════════════════════════════════════════

const businessStrategy: RewriteStrategy = {
  family: "general",

  preferredVerbs: [
    "Led", "Managed", "Directed", "Coordinated", "Streamlined",
    "Facilitated", "Implemented", "Delivered", "Organized", "Executed",
    "Improved", "Established", "Launched", "Oversaw", "Spearheaded",
  ],

  metricHeuristics: [
    {
      detectPattern: /\d+\s*%/,
      templates: [
        "improving efficiency by ~{n}%",
        "reducing cycle time by ~{n}%",
        "increasing satisfaction scores by ~{n}%",
      ],
    },
    {
      detectPattern: /\$[\d,.]+/,
      templates: [
        "saving approximately ${n} annually",
      ],
    },
  ],

  verbReplacements: [
    ...BASE_VERB_REPLACEMENTS,
    [/^Created\s+/i, "Established "],
    [/^Built\s+/i, "Developed "],
    [/^Managed\s+/i, "Directed "],
  ],

  rewriteBullet(bullet: string, signals: BulletSignals): string {
    return applyVerbReplacement(bullet, this.verbReplacements);
  },

  draftSummary(params: SummaryParams): string {
    const { headline, years, skills } = params;
    const skillList = skills.slice(0, 5).join(", ");
    const yearsStr = years > 0 ? `${years}+` : "";
    return `${headline} with ${yearsStr} years of experience driving operational excellence and delivering strategic initiatives. Skilled in ${skillList}. Proven track record of improving processes and achieving organizational goals.`;
  },

  draftCoverLetter(params: CoverLetterParams): string[] {
    return baseCoverLetter(params, "business operations and strategic execution");
  },
};

// ══════════════════════════════════════════════
// 3) Sales Strategy
// ══════════════════════════════════════════════

const salesStrategy: RewriteStrategy = {
  family: "sales",

  preferredVerbs: [
    "Closed", "Secured", "Generated", "Exceeded", "Expanded",
    "Negotiated", "Prospected", "Converted", "Upsold", "Retained",
    "Acquired", "Developed", "Grew", "Won", "Managed",
  ],

  metricHeuristics: [
    {
      detectPattern: /\d+\s*%/,
      templates: [
        "achieving ~{n}% of quota",
        "increasing win rate by ~{n}%",
        "growing territory revenue by ~{n}%",
      ],
    },
    {
      detectPattern: /\$[\d,.]+/,
      templates: [
        "generating ~${n} in pipeline",
        "closing ~${n} in annual revenue",
      ],
    },
    {
      detectPattern: /\d+\s*(deals?|accounts?|clients?)/i,
      templates: [
        "managing {n}+ accounts",
        "closing {n}+ deals per quarter",
      ],
    },
  ],

  verbReplacements: [
    ...BASE_VERB_REPLACEMENTS,
    [/^Created\s+/i, "Developed "],
    [/^Built\s+/i, "Grew "],
    [/^Managed\s+/i, "Owned and grew "],
  ],

  rewriteBullet(bullet: string, signals: BulletSignals): string {
    return applyVerbReplacement(bullet, this.verbReplacements);
  },

  draftSummary(params: SummaryParams): string {
    const { headline, years, skills } = params;
    const skillList = skills.slice(0, 5).join(", ");
    const yearsStr = years > 0 ? `${years}+` : "";
    return `${headline} with ${yearsStr} years of experience in revenue generation and client relationship management. Skilled in ${skillList}. Consistent track record of exceeding targets and building long-term client partnerships.`;
  },

  draftCoverLetter(params: CoverLetterParams): string[] {
    return baseCoverLetter(params, "sales and business development");
  },
};

// ══════════════════════════════════════════════
// 4) Marketing Strategy
// ══════════════════════════════════════════════

const marketingStrategy: RewriteStrategy = {
  family: "marketing",

  preferredVerbs: [
    "Launched", "Grew", "Drove", "Optimized", "Created",
    "Developed", "Executed", "Scaled", "Designed", "Published",
    "Produced", "Managed", "Analyzed", "Tested", "Increased",
  ],

  metricHeuristics: [
    {
      detectPattern: /\d+\s*%/,
      templates: [
        "increasing CTR by ~{n}%",
        "improving conversion rate by ~{n}%",
        "reducing CAC by ~{n}%",
        "growing engagement by ~{n}%",
      ],
    },
    {
      detectPattern: /\d+[KkMm]\+?\s*(leads?|subscribers?|followers?)/i,
      templates: [
        "generating ~{n} qualified leads",
        "growing audience to {n}+ subscribers",
      ],
    },
  ],

  verbReplacements: [
    ...BASE_VERB_REPLACEMENTS,
    [/^Created\s+/i, "Produced "],
    [/^Built\s+/i, "Developed "],
    [/^Managed\s+/i, "Directed "],
  ],

  rewriteBullet(bullet: string, signals: BulletSignals): string {
    return applyVerbReplacement(bullet, this.verbReplacements);
  },

  draftSummary(params: SummaryParams): string {
    const { headline, years, skills } = params;
    const skillList = skills.slice(0, 5).join(", ");
    const yearsStr = years > 0 ? `${years}+` : "";
    return `${headline} with ${yearsStr} years of experience in growth marketing and brand development. Skilled in ${skillList}. Proven ability to drive measurable campaign performance and build engaged audiences.`;
  },

  draftCoverLetter(params: CoverLetterParams): string[] {
    return baseCoverLetter(params, "marketing and growth strategy");
  },
};

// ══════════════════════════════════════════════
// 5) Finance Strategy
// ══════════════════════════════════════════════

const financeStrategy: RewriteStrategy = {
  family: "finance",

  preferredVerbs: [
    "Analyzed", "Audited", "Forecasted", "Reconciled", "Streamlined",
    "Reduced", "Optimized", "Managed", "Prepared", "Reviewed",
    "Consolidated", "Automated", "Implemented", "Directed", "Assessed",
  ],

  metricHeuristics: [
    {
      detectPattern: /\d+\s*%/,
      templates: [
        "reducing variance by ~{n}%",
        "improving forecasting accuracy by ~{n}%",
        "decreasing close cycle by ~{n}%",
      ],
    },
    {
      detectPattern: /\$[\d,.]+/,
      templates: [
        "managing ~${n} in assets",
        "identifying ~${n} in cost savings",
      ],
    },
  ],

  verbReplacements: [
    ...BASE_VERB_REPLACEMENTS,
    [/^Created\s+/i, "Developed "],
    [/^Built\s+/i, "Constructed "],
    [/^Managed\s+/i, "Oversaw "],
  ],

  rewriteBullet(bullet: string, signals: BulletSignals): string {
    return applyVerbReplacement(bullet, this.verbReplacements);
  },

  draftSummary(params: SummaryParams): string {
    const { headline, years, skills } = params;
    const skillList = skills.slice(0, 5).join(", ");
    const yearsStr = years > 0 ? `${years}+` : "";
    return `${headline} with ${yearsStr} years of experience in financial analysis and strategic planning. Skilled in ${skillList}. Proven ability to drive accuracy, ensure compliance, and deliver actionable financial insights.`;
  },

  draftCoverLetter(params: CoverLetterParams): string[] {
    return baseCoverLetter(params, "financial analysis and strategic planning");
  },
};

// ── Strategy registry ──

const STRATEGY_MAP: Record<string, RewriteStrategy> = {
  engineering: engineeringStrategy,
  business: businessStrategy,
  sales: salesStrategy,
  marketing: marketingStrategy,
  finance: financeStrategy,
};

/**
 * Get the RewriteStrategy for a given JobFamily.
 */
export function getStrategy(family: JobFamily): RewriteStrategy {
  const key = familyToStrategyKey(family);
  return STRATEGY_MAP[key] || businessStrategy;
}

/**
 * Get strategy by explicit key.
 */
export function getStrategyByKey(
  key: "engineering" | "business" | "sales" | "marketing" | "finance",
): RewriteStrategy {
  return STRATEGY_MAP[key] || businessStrategy;
}
