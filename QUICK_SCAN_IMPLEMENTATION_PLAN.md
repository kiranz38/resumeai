# Quick Scan Implementation Plan

## CV-Only Analysis with Market Benchmark Scoring

**Created:** 2026-02-21
**Status:** Phase 1 COMPLETE — TypeScript compiles clean
**Estimated scope:** ~15 files to create/modify

### Phase 1 Implementation Status
- [x] `src/lib/role-profiles/types.ts` — Created
- [x] `src/lib/role-profiles/seed-profiles.ts` — Created (45 profiles, ~2700 lines)
- [x] `src/lib/role-profiles/matcher.ts` — Created (role extraction, fuzzy matching, JobProfile conversion)
- [x] `src/app/api/quick-scan/route.ts` — Created (API endpoint)
- [x] `src/app/results/quick/page.tsx` — Created (results page with conversion CTAs)
- [x] `src/app/analyze/page.tsx` — Modified (Quick Scan hub tile, new phases, JD bridge)
- [x] `src/lib/cache.ts` — Modified (added quickScanCache)
- [x] `src/lib/sanitizer.ts` — Modified (added QuickScanRequestSchema + payload size)
- [x] TypeScript compilation — PASSING (0 errors)

---

## Table of Contents

1. [Context & Goal](#1-context--goal)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 1 — MVP with Hardcoded Role Profiles](#3-phase-1--mvp-with-hardcoded-role-profiles)
4. [Phase 2 — Postgres + Weekly Cron Pipeline](#4-phase-2--postgres--weekly-cron-pipeline)
5. [Phase 3 — Redis Cache (If Needed)](#5-phase-3--redis-cache-if-needed)
6. [File-by-File Implementation Guide](#6-file-by-file-implementation-guide)
7. [Database Schema](#7-database-schema)
8. [API Contracts](#8-api-contracts)
9. [UI Flow Changes](#9-ui-flow-changes)
10. [Conversion Funnel Design](#10-conversion-funnel-design)
11. [Cost Estimates](#11-cost-estimates)
12. [Testing Plan](#12-testing-plan)
13. [Rollback Strategy](#13-rollback-strategy)

---

## 1. Context & Goal

### Problem
The current flow requires users to both upload a CV AND paste a job description before seeing any value. The JD paste step is a major friction point causing drop-offs.

### Solution
Add a "Quick Scan" flow: user uploads CV only. We extract their target role from the CV, match against pre-built role profiles (distilled from real JDs worldwide), and show market benchmark scores.

### Two-Funnel Strategy

| Flow | Input | Output | Conversion Goal |
|---|---|---|---|
| **Quick Scan** (new) | CV only | Market benchmark scores against top matching roles | Hook → upsell to Deep Match or Pro |
| **Deep Match** (existing) | CV + JD | Precise match score for a specific job | Direct to Pro |

Quick Scan is the low-friction top-of-funnel. Deep Match remains the high-value path.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    QUICK SCAN FLOW                        │
│                                                          │
│  User uploads CV                                         │
│       ↓                                                  │
│  parseResume() → CandidateProfile                        │
│       ↓                                                  │
│  extractTargetRole(candidate) → normalized role title    │
│       ↓                                                  │
│  lookupRoleProfiles(title, country?)                     │
│    → top 3-5 matching RoleProfiles from DB/cache         │
│       ↓                                                  │
│  For each RoleProfile:                                   │
│    Convert to JobProfile → scoreRadar() + scoreATS()     │
│       ↓                                                  │
│  QuickScanResult {                                       │
│    candidateProfile,                                     │
│    roleMatches: [{ role, score, breakdown, gaps }],      │
│    generalStrengths,                                     │
│    formattingIssues,                                     │
│    rewritePreviews                                       │
│  }                                                       │
│       ↓                                                  │
│  Results Page: "Your CV scores X for Y roles"            │
│       ↓                                                  │
│  CTA: "Have a specific job? Paste the JD →"              │
│  CTA: "Fix all issues → Pro"                             │
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Role profiles, not raw JDs.** We store distilled composite profiles (skills + keywords + responsibilities with frequency weights), not full JD text. This is cheaper, faster, and avoids API ToS issues.

2. **Reuse existing scorers.** Convert `RoleProfile` → `JobProfile` (existing type) and feed into existing `scoreRadar()` + `scoreATS()`. Zero new scoring logic needed.

3. **No LLM for Quick Scan.** The free tier analysis is already fully deterministic. Quick Scan stays deterministic too.

4. **Phase the rollout.** Start with hardcoded profiles (validate the funnel), then add DB + cron (scale the catalog).

---

## 3. Phase 1 — MVP with Hardcoded Role Profiles

**Goal:** Ship Quick Scan with ~50 hardcoded role profiles to validate the funnel before building infrastructure.

### 3.1 Create Role Profile Data Structure

**New file:** `src/lib/role-profiles/types.ts`

```typescript
export interface RoleProfile {
  id: string;                          // "senior-software-engineer-us"
  normalizedTitle: string;             // "Senior Software Engineer"
  aliases: string[];                   // ["Sr. Software Engineer", "Sr Software Dev", ...]
  category: string;                    // "engineering"
  seniority: "junior" | "mid" | "senior" | "lead" | "executive";
  countryCode: string;                 // "US", "GB", "GLOBAL"

  requiredSkills: WeightedItem[];      // [{ value: "Python", weight: 0.87 }, ...]
  preferredSkills: WeightedItem[];
  commonKeywords: WeightedItem[];
  typicalResponsibilities: string[];

  salaryRange?: { min: number; median: number; max: number; currency: string };
  sourceCount: number;                 // How many JDs this was built from
  lastRefreshed: string;               // ISO date
}

export interface WeightedItem {
  value: string;
  weight: number;                      // 0.0 - 1.0 (frequency across source JDs)
}

export interface RoleMatch {
  profile: RoleProfile;
  score: number;                       // 0-100 radar score
  radarBreakdown: RadarBreakdown;
  missingSkills: string[];
  missingKeywords: string[];
  matchedSkills: string[];
}

export interface QuickScanResult {
  candidateProfile: CandidateProfile;
  roleMatches: RoleMatch[];            // Top 3-5 matching roles
  generalStrengths: string[];
  formattingIssues: string[];
  rewritePreviews: Array<{ original: string; improved: string }>;
  bestMatchScore: number;
  bestMatchRole: string;
}
```

### 3.2 Seed Data — Hardcoded Role Profiles

**New file:** `src/lib/role-profiles/seed-profiles.ts`

Create ~50 role profiles covering the most common roles across categories:

**Engineering (15 profiles):**
- Software Engineer (junior/mid/senior)
- Frontend Developer (mid/senior)
- Backend Developer (mid/senior)
- Full-Stack Developer (mid/senior)
- DevOps/SRE Engineer (mid/senior)
- Data Engineer (mid/senior)
- Mobile Developer (mid/senior)
- Engineering Manager

**Product & Design (8 profiles):**
- Product Manager (mid/senior)
- Product Designer / UX Designer (mid/senior)
- UI Designer
- Technical Program Manager
- Scrum Master

**Data & Analytics (6 profiles):**
- Data Scientist (mid/senior)
- Data Analyst (mid/senior)
- Machine Learning Engineer
- Business Intelligence Analyst

**Business & Operations (8 profiles):**
- Project Manager (mid/senior)
- Business Analyst
- Operations Manager
- Management Consultant
- Supply Chain Manager

**Marketing & Sales (8 profiles):**
- Marketing Manager
- Digital Marketing Specialist
- Content Strategist
- Sales Manager / Account Executive
- Customer Success Manager
- Growth Manager

**Finance & Accounting (5 profiles):**
- Financial Analyst
- Accountant (mid/senior)
- FP&A Analyst
- Controller

Each profile should contain:
- 10-15 required skills with weights (sourced from O*NET + industry knowledge)
- 5-10 preferred skills
- 15-25 common keywords
- 5-8 typical responsibilities
- Salary ranges (approximate, by country)

**Important:** Mark all seed profiles with `sourceCount: 0` and `lastRefreshed: "2026-02-21"` so we know they're manually created, not API-sourced.

### 3.3 Role Matching Logic

**New file:** `src/lib/role-profiles/matcher.ts`

```typescript
/**
 * Extract the user's target role from their CV.
 * Uses: most recent job title, headline, or skills cluster.
 */
export function extractTargetRole(candidate: CandidateProfile): string

/**
 * Fuzzy-match a role string against all available profiles.
 * Returns top N matches sorted by relevance.
 *
 * Matching strategy:
 * 1. Exact title match (normalized, case-insensitive)
 * 2. Alias match
 * 3. Category + seniority match with skill overlap scoring
 * 4. Fall back to skill-cluster similarity if no title match
 */
export function findMatchingProfiles(
  roleTitle: string,
  skills: string[],
  seniority: string,
  countryCode?: string,
  limit?: number
): RoleProfile[]

/**
 * Convert a RoleProfile to the existing JobProfile type
 * so we can feed it into scoreRadar() and scoreATS().
 */
export function roleProfileToJobProfile(profile: RoleProfile): JobProfile
```

**Matching algorithm details:**

```
1. Normalize input: lowercase, remove seniority prefixes, strip punctuation
2. For each RoleProfile:
   a. titleScore = fuzzy match (Levenshtein or token overlap) against title + aliases
   b. skillScore = Jaccard similarity between candidate skills and profile requiredSkills
   c. seniorityBonus = +0.2 if seniority matches
   d. combinedScore = titleScore * 0.6 + skillScore * 0.3 + seniorityBonus * 0.1
3. Sort by combinedScore, return top N
```

No external dependencies needed — simple string matching + set operations.

### 3.4 Quick Scan API Endpoint

**New file:** `src/app/api/quick-scan/route.ts`

```typescript
// POST /api/quick-scan
// Body: { resumeText: string }
// Response: QuickScanResult

export async function POST(req: Request) {
  // 1. Rate limit check (reuse existing rate-limiter)
  // 2. Parse & validate input (resumeText only, use existing sanitizer)
  // 3. Parse resume → CandidateProfile (reuse parseResume())
  // 4. Extract target role + seniority from candidate
  // 5. Find top 3-5 matching role profiles
  // 6. For each profile:
  //    a. Convert to JobProfile via roleProfileToJobProfile()
  //    b. Score with scoreRadar(candidate, jobProfile)
  //    c. Score with scoreATS(candidate, jobProfile)
  //    d. Collect missingSkills, matchedSkills
  // 7. Generate general strengths (reuse generateStrengths with best-match profile)
  // 8. Generate formatting issues (reuse radar formatting dimension)
  // 9. Generate rewrite previews (reuse generateRewritePreviews with best-match)
  // 10. Cache result
  // 11. Return QuickScanResult
}
```

### 3.5 UI Changes — Analyze Page

**Modify:** `src/app/analyze/page.tsx`

Add a new entry point in the hub phase:

```
Current hub options:
  1. "Optimize for a Job" (resume + JD flow)
  2. "Bulk CV Generator"
  3. "Create from Scratch"

Add:
  0. "Quick Resume Scan" (NEW — primary, most prominent)
      "Upload your CV and see how you score against the market"
```

**New phase:** `"quick_analyzing"` — same progress UI as existing "analyzing" but calls `/api/quick-scan` instead of `/api/analyze`.

**After analysis:** Redirect to `/results/quick` (new page) instead of `/results`.

Session storage additions:
- `rt_quick_scan` — stores QuickScanResult
- `rt_scan_mode` — "quick" | "deep" (to know which flow the user came from)

### 3.6 Quick Scan Results Page

**New file:** `src/app/results/quick/page.tsx`

Layout:

```
┌─────────────────────────────────────────────┐
│  Your Resume Market Score                    │
│  "Here's how your CV stacks up"             │
├─────────────────────────────────────────────┤
│                                             │
│  Best Match: Senior Software Engineer       │
│  Score: 72/100 [radar gauge]                │
│  Breakdown bars (5 dimensions)              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Also scored against:                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Full-Stack│ │ Backend  │ │ DevOps   │   │
│  │   68/100  │ │  61/100  │ │  45/100  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Missing Skills (from best match):          │
│  Kubernetes, Terraform, GraphQL, ...        │
│                                             │
│  Your Strengths:                            │
│  ✓ 7+ years experience                     │
│  ✓ Quantified impact metrics               │
│                                             │
│  Formatting Issues:                         │
│  ⚠ No professional summary                 │
│  ⚠ Weak action verbs in 4 bullets          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🎯 Have a specific job in mind?    │   │
│  │                                     │   │
│  │  Paste the job description for a    │   │
│  │  precise match score + tailored     │   │
│  │  resume fixes.                      │   │
│  │                                     │   │
│  │  [Analyze for a Specific Job →]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ── OR ──                                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Fix all issues automatically       │   │
│  │  Get a tailored CV for your best-   │   │
│  │  matching role — $5                 │   │
│  │                                     │   │
│  │  [Fix My Resume Now — $5]           │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  Rewrite Previews (1 visible, rest locked)  │
│  Session urgency notice                     │
│  Social proof                               │
└─────────────────────────────────────────────┘
```

**Key funnel elements on this page:**
1. Show enough value to prove the tool works (score, breakdown, missing skills)
2. Primary CTA: "Paste a JD for precise analysis" (moves them to Deep Match flow → higher conversion)
3. Secondary CTA: "Fix my resume now" (direct to Pro checkout using best-match profile as the JD)
4. Reuse components: ScoreCard, StrengthsList, KeywordList, RewritePreviews, PaywallPlanPicker

### 3.7 Landing Page Changes

**Modify:** `src/app/page.tsx`

The primary hero CTA should change based on the two-funnel strategy:

```
Primary CTA:  "Check My Resume — Free" → links to /analyze with quick scan as default
Secondary:    "Match Against a Specific Job →" → links to /analyze?action=upload (existing deep flow)
```

Or keep the existing CTA but make the analyze hub page default to Quick Scan as the most prominent option.

### 3.8 Navigation Between Flows

After Quick Scan results, when user clicks "Analyze for a Specific Job":
1. Resume text is already in `sessionStorage` (from quick scan)
2. Redirect to `/analyze?phase=jd_input` — skip resume upload, go straight to JD paste
3. This removes ALL friction from the Deep Match flow since resume is already uploaded

This is a key insight: Quick Scan pre-loads the resume, so the Deep Match becomes a **one-step** flow (just paste JD).

---

## 4. Phase 2 — Postgres + Weekly Cron Pipeline

**Goal:** Replace hardcoded profiles with a database of role profiles auto-refreshed from real JD data.

### 4.1 Database Setup

**Provider options (all have generous free tiers):**
- **Supabase** — Free: 500MB, 2 projects. Hosted Postgres. Good dashboard.
- **Neon** — Free: 512MB, branching. Serverless Postgres. Best for Vercel.
- **PlanetScale** — Free: 5GB. MySQL (not Postgres). Different query patterns.

**Recommendation:** Neon. Serverless, auto-scales, pairs well with Vercel, and the free tier is sufficient for 10,000+ role profiles.

**ORM:** Use Drizzle ORM — lightweight, type-safe, works well with serverless.

### 4.2 New Dependencies

```
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### 4.3 Database Schema

**New file:** `src/lib/db/schema.ts`

```sql
-- Core table: distilled role profiles
CREATE TABLE role_profiles (
  id                SERIAL PRIMARY KEY,
  normalized_title  TEXT NOT NULL,
  aliases           JSONB DEFAULT '[]',           -- alternative titles
  category          TEXT NOT NULL,                 -- "engineering", "marketing", etc.
  seniority         TEXT NOT NULL,                 -- "junior", "mid", "senior", "lead"
  country_code      TEXT NOT NULL DEFAULT 'GLOBAL',

  required_skills   JSONB NOT NULL,               -- [{ "value": "Python", "weight": 0.87 }]
  preferred_skills  JSONB DEFAULT '[]',
  common_keywords   JSONB NOT NULL,
  responsibilities  JSONB DEFAULT '[]',

  salary_min        INTEGER,
  salary_median     INTEGER,
  salary_max        INTEGER,
  salary_currency   TEXT DEFAULT 'USD',

  source_count      INTEGER DEFAULT 0,            -- JDs this was distilled from
  is_seed           BOOLEAN DEFAULT FALSE,        -- true = manually created
  refreshed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(normalized_title, country_code, seniority)
);

-- Index for fast lookups
CREATE INDEX idx_role_profiles_category ON role_profiles(category);
CREATE INDEX idx_role_profiles_country ON role_profiles(country_code);
CREATE INDEX idx_role_profiles_title_trgm ON role_profiles USING gin(normalized_title gin_trgm_ops);

-- Refresh tracking
CREATE TABLE refresh_log (
  id              SERIAL PRIMARY KEY,
  role_title      TEXT NOT NULL,
  country_code    TEXT NOT NULL,
  jds_fetched     INTEGER DEFAULT 0,
  jds_processed   INTEGER DEFAULT 0,
  status          TEXT NOT NULL,      -- "success", "partial", "failed", "skipped"
  error_message   TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking (to stay within budget)
CREATE TABLE api_usage (
  id              SERIAL PRIMARY KEY,
  api_name        TEXT NOT NULL,      -- "jsearch", "adzuna", "onet"
  requests_made   INTEGER DEFAULT 0,
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Weekly Cron Job

**New file:** `src/app/api/cron/refresh-roles/route.ts`

This is a Vercel Cron endpoint (or can be triggered by GitHub Actions).

```
Cron schedule: Every Sunday at 3:00 AM UTC
Vercel cron config in vercel.json:
{
  "crons": [{ "path": "/api/cron/refresh-roles", "schedule": "0 3 * * 0" }]
}
```

**Refresh algorithm:**

```
1. Load all role_profiles from DB
2. Sort by refreshed_at ASC (oldest first)
3. Check API budget remaining for this period
4. For each profile (up to budget):
   a. Fetch 20-50 JDs from JSearch API for this role + country
   b. For each JD:
      - Extract skills, keywords, responsibilities using jd-parser.ts
      - Normalize and deduplicate
   c. Aggregate across all fetched JDs:
      - skills: count frequency → weight = count / total_jds
      - keywords: same frequency weighting
      - responsibilities: deduplicate similar ones, keep top 8
   d. Merge with existing profile data (weighted average with existing):
      - new_weight = (old_weight * old_source_count + new_weight * new_source_count)
                     / (old_source_count + new_source_count)
   e. Upsert role_profile with updated data
   f. Log to refresh_log
5. Return summary
```

**Budget management:**
- JSearch free tier: 500 req/mo → ~100 roles/week (5 JDs per request page)
- JSearch Pro ($20/mo): 10K req/mo → ~2000 roles/week
- Track usage in api_usage table
- Skip refresh if budget exhausted

### 4.5 JSearch API Integration

**New file:** `src/lib/jd-sources/jsearch.ts`

```typescript
const JSEARCH_BASE = "https://jsearch.p.rapidapi.com";

interface JSearchConfig {
  apiKey: string;        // RAPIDAPI_KEY env var
  maxRequestsPerRun: number;
}

/**
 * Fetch job postings for a role title in a country.
 * Returns normalized JD data (not raw postings).
 */
export async function fetchJDs(
  roleTitle: string,
  countryCode: string,
  limit: number
): Promise<NormalizedJD[]>

/**
 * Process raw JSearch results into normalized format.
 */
function normalizeJSearchResult(result: JSearchResult): NormalizedJD
```

**Env vars needed:**
```
RAPIDAPI_KEY=your_key_here
JSEARCH_ENABLED=true
CRON_SECRET=random_secret_for_cron_auth
```

### 4.6 Migrate Matcher to Use DB

**Modify:** `src/lib/role-profiles/matcher.ts`

Replace in-memory lookup with Postgres query:

```typescript
// Phase 1 (MVP):
// import { SEED_PROFILES } from "./seed-profiles";
// const profiles = SEED_PROFILES.filter(...)

// Phase 2 (DB):
// const profiles = await db.select().from(roleProfiles)
//   .where(and(
//     or(ilike(normalized_title, `%${search}%`), /* alias match */),
//     eq(country_code, country)
//   ))
//   .limit(10)
```

Use a feature flag or environment variable to switch between seed data and DB:
```
ROLE_PROFILES_SOURCE=seed   # Phase 1
ROLE_PROFILES_SOURCE=db     # Phase 2
```

---

## 5. Phase 3 — Redis Cache (If Needed)

**Only build this if:** Postgres query latency becomes a bottleneck (unlikely under 10K profiles).

**Provider:** Upstash Redis (serverless, free tier: 10K commands/day)

**Cache strategy:**
- Cache key: `role:${normalizedTitle}:${countryCode}:${seniority}`
- TTL: 7 days (matches weekly refresh)
- Cache-aside pattern: check Redis → miss → query Postgres → populate Redis
- Invalidate on cron refresh

**This is genuinely unnecessary for Phase 1 and probably Phase 2.** Postgres can serve 7,500 role profiles in <50ms. Don't add Redis complexity until you have data showing it's needed.

---

## 6. File-by-File Implementation Guide

### New Files to Create

| # | File | Purpose | Phase |
|---|---|---|---|
| 1 | `src/lib/role-profiles/types.ts` | TypeScript types for RoleProfile, QuickScanResult | 1 |
| 2 | `src/lib/role-profiles/seed-profiles.ts` | ~50 hardcoded role profiles | 1 |
| 3 | `src/lib/role-profiles/matcher.ts` | Role extraction + fuzzy matching + JobProfile conversion | 1 |
| 4 | `src/app/api/quick-scan/route.ts` | Quick Scan API endpoint | 1 |
| 5 | `src/app/results/quick/page.tsx` | Quick Scan results page | 1 |
| 6 | `src/lib/db/schema.ts` | Drizzle schema for role_profiles | 2 |
| 7 | `src/lib/db/index.ts` | DB connection + query helpers | 2 |
| 8 | `src/lib/jd-sources/jsearch.ts` | JSearch API client | 2 |
| 9 | `src/lib/jd-sources/distiller.ts` | Aggregate JDs into role profiles | 2 |
| 10 | `src/app/api/cron/refresh-roles/route.ts` | Weekly cron endpoint | 2 |
| 11 | `drizzle.config.ts` | Drizzle ORM config | 2 |

### Files to Modify

| # | File | Changes | Phase |
|---|---|---|---|
| 1 | `src/app/analyze/page.tsx` | Add Quick Scan hub option + quick_analyzing phase | 1 |
| 2 | `src/app/page.tsx` | Update hero to promote Quick Scan as primary action (optional) | 1 |
| 3 | `src/lib/types.ts` | Add QuickScanResult type (or import from role-profiles/types) | 1 |
| 4 | `src/lib/cache.ts` | Add quickScanCache alongside existing caches | 1 |
| 5 | `src/lib/role-profiles/matcher.ts` | Switch from seed to DB lookup | 2 |
| 6 | `package.json` | Add drizzle-orm, @neondatabase/serverless | 2 |
| 7 | `vercel.json` | Add cron schedule (if using Vercel Cron) | 2 |

---

## 7. Database Schema

See [Section 4.3](#43-database-schema) for full SQL.

**Summary:**
- `role_profiles` — Core table, ~7,500 rows (500 roles x 15 countries)
- `refresh_log` — Audit trail for cron runs
- `api_usage` — Budget tracking for external APIs

**Total storage estimate:** <50MB (well within free tiers)

---

## 8. API Contracts

### POST /api/quick-scan

**Request:**
```json
{
  "resumeText": "string (required, max 50000 chars)"
}
```

**Response (200):**
```json
{
  "candidateProfile": { /* CandidateProfile */ },
  "roleMatches": [
    {
      "profile": {
        "normalizedTitle": "Senior Software Engineer",
        "category": "engineering",
        "seniority": "senior",
        "countryCode": "US"
      },
      "score": 72,
      "radarBreakdown": {
        "hardSkills": 65,
        "softSkills": 80,
        "measurableResults": 70,
        "keywordOptimization": 58,
        "formattingBestPractices": 85
      },
      "missingSkills": ["Kubernetes", "Terraform", "GraphQL"],
      "missingKeywords": ["microservices", "CI/CD", "distributed systems"],
      "matchedSkills": ["Python", "TypeScript", "React", "AWS"]
    }
    // ... up to 5 matches
  ],
  "generalStrengths": ["7+ years experience", "Quantified impact in 60% of bullets"],
  "formattingIssues": ["No professional summary section", "4 bullets use weak action verbs"],
  "rewritePreviews": [
    { "original": "Worked on backend services", "improved": "Architected and deployed 3 backend microservices serving 50K RPM" }
  ],
  "bestMatchScore": 72,
  "bestMatchRole": "Senior Software Engineer"
}
```

**Error responses:**
- 400: Invalid input (missing/too-short resume)
- 429: Rate limited
- 500: Server error

### POST /api/cron/refresh-roles (Phase 2)

**Headers:** `Authorization: Bearer ${CRON_SECRET}`

**Response (200):**
```json
{
  "profilesRefreshed": 47,
  "profilesSkipped": 3,
  "apiCallsMade": 235,
  "budgetRemaining": 9765,
  "errors": []
}
```

---

## 9. UI Flow Changes

### 9.1 Analyze Page Hub — New Option

Add "Quick Resume Scan" as the first/most prominent option in the hub:

```
┌─────────────────────────────────────────────┐
│                                             │
│  ⚡ Quick Resume Scan         [NEW]         │
│  Upload your CV and see how you score       │
│  against the market. No job description     │
│  needed.                                    │
│                                             │
│  [Upload My CV →]                           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🎯 Match Against a Specific Job            │
│  Upload your CV + paste a job description   │
│  for a precise match score.                 │
│                                             │
│  [Start Deep Analysis →]                    │
│                                             │
├─────────────────────────────────────────────┤
│  (existing options: Bulk CV, Create, etc.)  │
└─────────────────────────────────────────────┘
```

### 9.2 Quick Scan Phase Flow

```
hub → resume_input → quick_analyzing → redirect to /results/quick
```

Skip `jd_input` phase entirely. Reuse existing resume upload UI.

### 9.3 Results/Quick → Deep Match Bridge

When user clicks "Analyze for a Specific Job" on quick scan results:
1. Resume is already in sessionStorage
2. Navigate to `/analyze?phase=jd_input`
3. Analyze page detects `phase=jd_input` query param + existing `rt_resume_text`
4. Skips directly to JD paste step
5. After JD submit → normal deep analysis flow

This makes the Deep Match flow **one step** for Quick Scan users.

---

## 10. Conversion Funnel Design

### Funnel Path A: Quick Scan → Deep Match → Pro
```
Landing page → Quick Scan (1 step) → Results/Quick
  → "Paste a JD" → Deep Match (1 more step) → Results
    → Pro upgrade ($5)
```
**Total steps to Pro:** 3 (upload CV, paste JD, pay)
**Improvement over current:** Same steps, but value shown earlier (after step 1)

### Funnel Path B: Quick Scan → Direct Pro
```
Landing page → Quick Scan (1 step) → Results/Quick
  → "Fix My Resume Now" → Pro checkout ($5)
```
**Total steps to Pro:** 2 (upload CV, pay)
**Use case:** User doesn't have a specific job in mind, just wants a better resume

### Funnel Path C: Existing Deep Match (unchanged)
```
Landing page → Upload CV + Paste JD → Results → Pro upgrade ($5)
```
**Total steps to Pro:** 3 (unchanged)

### Key Conversion Points on Quick Scan Results Page

1. **Score shock** — "Your CV scores 47/100 for Software Engineer roles"
2. **Specificity** — "You're missing 12 critical keywords that 87% of job postings require"
3. **Bridge CTA** — "Have a specific job? Get a precise score →" (moves to Deep Match)
4. **Direct CTA** — "Fix all issues now — $5" (direct to Pro with best-match profile as JD)
5. **Session urgency** — "This analysis is session-only"

---

## 11. Cost Estimates

### Phase 1 (MVP — Hardcoded Profiles)
| Item | Cost |
|---|---|
| Development | Code changes only |
| Hosting | $0 (existing Vercel) |
| APIs | $0 (no external calls) |
| **Total** | **$0/mo** |

### Phase 2 (DB + Cron)
| Item | Cost |
|---|---|
| Neon Postgres (free tier) | $0 |
| JSearch API (Pro tier) | $20/mo |
| LLM for distillation (optional) | $5-15/mo |
| Vercel Cron | $0 (included) |
| **Total** | **$20-35/mo fixed** |

### At Scale (10K+ daily scans)
| Item | Cost |
|---|---|
| Neon Postgres (Pro) | $19/mo |
| JSearch (Ultra) | $100/mo |
| Upstash Redis (if needed) | $0-10/mo |
| **Total** | **$120-130/mo** |

---

## 12. Testing Plan

### Unit Tests

```
src/lib/role-profiles/__tests__/
  matcher.test.ts
    - extractTargetRole: various CV formats, missing titles, ambiguous roles
    - findMatchingProfiles: exact match, fuzzy match, skill-only match, no match
    - roleProfileToJobProfile: correct field mapping

src/app/api/quick-scan/__tests__/
  route.test.ts
    - Valid resume → returns QuickScanResult with matches
    - Empty resume → 400
    - Too-short resume → 400
    - Rate limiting → 429
```

### Integration Tests

```
1. Upload a real software engineer resume → verify top match is engineering role
2. Upload a marketing resume → verify top match is marketing role
3. Upload a resume with no clear role → verify graceful fallback
4. Quick Scan → click "Analyze for Specific Job" → verify resume pre-loaded
5. Quick Scan → click "Fix My Resume Now" → verify checkout flow works
```

### Manual Testing Checklist

- [ ] Quick Scan from landing page CTA
- [ ] Quick Scan from analyze hub
- [ ] Results page shows correct scores and breakdowns
- [ ] "Analyze for Specific Job" bridge works (resume pre-loaded)
- [ ] Direct Pro checkout from Quick Scan results
- [ ] Mobile responsiveness of results/quick page
- [ ] Session storage correctly populated
- [ ] Back navigation doesn't break state
- [ ] Demo mode still works (unaffected)

---

## 13. Rollback Strategy

### Phase 1
All changes are additive. To rollback:
1. Remove Quick Scan option from analyze hub
2. Remove `/api/quick-scan` route
3. Remove `/results/quick` page
4. Existing Deep Match flow is completely untouched

### Phase 2
DB and cron are independent of the core app:
1. Set `ROLE_PROFILES_SOURCE=seed` to fall back to hardcoded
2. Disable cron job
3. DB can be retained or dropped without affecting anything

---

## Implementation Order (Recommended)

### Phase 1 — Ship in this order:

```
Step 1: src/lib/role-profiles/types.ts              (types only)
Step 2: src/lib/role-profiles/seed-profiles.ts       (data, largest file)
Step 3: src/lib/role-profiles/matcher.ts             (core logic)
Step 4: src/app/api/quick-scan/route.ts              (API endpoint)
Step 5: src/lib/cache.ts                             (add quickScanCache)
Step 6: src/app/results/quick/page.tsx               (results UI)
Step 7: src/app/analyze/page.tsx                     (add hub option + phase)
Step 8: Test everything end-to-end
Step 9: Optional: update landing page hero
```

### Phase 2 — After validating Phase 1 metrics:

```
Step 1: Set up Neon database + Drizzle config
Step 2: Create schema + run migrations
Step 3: Seed DB from existing hardcoded profiles
Step 4: Build JSearch integration
Step 5: Build distiller (aggregate JDs → profile)
Step 6: Build cron endpoint
Step 7: Switch matcher to DB source
Step 8: Monitor cron runs + data quality
```

---

## Codebase Context for Next Agent

### Key files to understand before implementing:

| File | Why |
|---|---|
| `src/app/analyze/page.tsx` (854 lines) | Main analyze flow — add Quick Scan phase here |
| `src/app/api/analyze/route.ts` (105 lines) | Reference for building quick-scan endpoint |
| `src/lib/resume-parser.ts` (752 lines) | Reuse `parseResume()` — already robust |
| `src/lib/jd-parser.ts` (230 lines) | Reference for what a JobProfile looks like |
| `src/lib/ats-scorer.ts` (687 lines) | Reuse `scoreATS(candidate, jobProfile)` |
| `src/lib/radar-scorer.ts` (668 lines) | Reuse `scoreRadar(candidate, jobProfile)` |
| `src/lib/types.ts` (137 lines) | Core types: CandidateProfile, JobProfile, RadarResult, etc. |
| `src/lib/cache.ts` | Add new cache entry for quick scan |
| `src/lib/constants.ts` | Pricing constants, regions, feature flags |
| `src/lib/sanitizer.ts` | Input validation — reuse for quick-scan |
| `src/lib/rate-limiter.ts` | Rate limiting — reuse for quick-scan |

### Critical patterns to follow:
1. **Free tier = deterministic.** No LLM calls. Use `parseResume()`, `scoreRadar()`, `scoreATS()`.
2. **Score capped at 60 on free tier** (see analyze/route.ts ~line 90). Apply same cap to Quick Scan.
3. **Session storage keys** all use `rt_` prefix. Follow this convention.
4. **Analytics** use `trackEvent(name, props)` from `src/lib/analytics.ts`.
5. **Rate limiting** uses per-IP sliding window from `src/lib/rate-limiter.ts`.

### What NOT to change:
- Existing `/api/analyze` endpoint — leave untouched
- Existing `/results/page.tsx` — leave untouched
- Entitlement system — Quick Scan is free, no tokens needed
- Pro generation pipeline — unrelated to Quick Scan
