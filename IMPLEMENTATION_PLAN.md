# Implementation Plan — Resume Tailor

## Architecture Overview

```
src/
  app/
    layout.tsx            — Root layout + header/footer + legal snippet
    page.tsx              — Landing page (/)
    analyze/page.tsx      — Upload/paste inputs (/analyze)
    results/page.tsx      — Results + paywall (/results)
    demo/page.tsx         — Instant demo (/demo)
    pricing/page.tsx      — Pricing page
    how-it-works/page.tsx — How it works
    privacy/page.tsx      — Privacy policy
    terms/page.tsx        — Terms of service
    contact/page.tsx      — Contact page
    api/
      analyze/route.ts    — POST: AI analysis endpoint
      stripe/
        create-checkout-session/route.ts
        verify/route.ts
    sitemap.ts            — Dynamic sitemap
    robots.ts             — Robots.txt
  components/
    Header.tsx
    Footer.tsx
    ScoreCard.tsx
    KeywordMap.tsx
    RewritePack.tsx
    ExperienceGaps.tsx
    ATSWarnings.tsx
    CoverLetter.tsx
    Paywall.tsx
    ProgressSteps.tsx
    CopyButton.tsx
    FileUpload.tsx
    FAQ.tsx
  lib/
    schema.ts             — Zod schema + TS types for ResumeTailorResult
    ai.ts                 — AI prompt + call logic
    parsing.ts            — PDF/DOCX/TXT extraction (client-side)
    stripe.ts             — Stripe helpers
    analytics.ts          — GA4 event helper
    demo-data.ts          — Static precomputed demo result
    constants.ts          — Pricing, config, feature flags
    utils.ts              — Shared utilities
  hooks/
    useAnalysis.ts        — Analysis state management
```

## Milestone Breakdown

### Milestone 0: Repo Audit + Plan ✓
- [x] Inspect repo state
- [x] Create PRODUCT_AUDIT.md
- [x] Create IMPLEMENTATION_PLAN.md
- [x] Install dependencies (zod, pdfjs-dist, mammoth, stripe)
- [x] Set up .env.example

### Milestone 1: Landing + Demo + Legal Pages
Files to create/modify:
- `src/app/layout.tsx` — Global layout with Header + Footer + legal snippet
- `src/app/globals.css` — Design tokens, base styles
- `src/components/Header.tsx` — Nav bar
- `src/components/Footer.tsx` — Footer with legal snippet
- `src/components/FAQ.tsx` — Reusable FAQ accordion
- `src/app/page.tsx` — Landing page (H1, CTAs, benefits, pricing teaser, FAQ)
- `src/app/demo/page.tsx` — Instant demo with static data
- `src/lib/demo-data.ts` — Precomputed ResumeTailorResult JSON
- `src/lib/schema.ts` — Define types early so demo data is typed
- `src/app/pricing/page.tsx` — Pricing page
- `src/app/privacy/page.tsx` — Privacy policy
- `src/app/terms/page.tsx` — Terms of service
- `src/app/how-it-works/page.tsx` — How it works
- `src/app/contact/page.tsx` — Contact

Acceptance: Landing loads, demo renders in <1s, legal pages have content.

### Milestone 2: Analyze Flow + Parsing
Files to create/modify:
- `src/app/analyze/page.tsx` — Upload/paste UI with dropdowns
- `src/components/FileUpload.tsx` — Drag-drop file upload
- `src/components/ProgressSteps.tsx` — Step indicator
- `src/lib/parsing.ts` — PDF/DOCX/TXT extraction functions
- `src/hooks/useAnalysis.ts` — State management for analysis flow

Acceptance: User can upload PDF/DOCX/TXT or paste text, text is extracted client-side.

### Milestone 3: AI Endpoint + Schema
Files to create/modify:
- `src/lib/schema.ts` — Full zod schema for ResumeTailorResult
- `src/lib/ai.ts` — AI prompt construction + API call + retry logic
- `src/app/api/analyze/route.ts` — POST endpoint
- `src/lib/constants.ts` — Config values

Acceptance: POST /api/analyze returns valid typed JSON, retries on invalid schema.

### Milestone 4: Results Preview + Paywall UI
Files to create/modify:
- `src/app/results/page.tsx` — Results page layout
- `src/components/ScoreCard.tsx` — Dual score display
- `src/components/KeywordMap.tsx` — Keyword groups (preview: 5)
- `src/components/RewritePack.tsx` — Bullet rewrites (preview: 3)
- `src/components/ATSWarnings.tsx` — Formatting warnings (preview: 3)
- `src/components/Paywall.tsx` — Unlock card
- `src/components/CopyButton.tsx` — Copy to clipboard

Acceptance: Free preview shows scores + 5 keywords + 3 rewrites + 3 warnings.

### Milestone 5: Stripe Checkout + Unlock
Files to create/modify:
- `src/app/api/stripe/create-checkout-session/route.ts`
- `src/app/api/stripe/verify/route.ts`
- `src/lib/stripe.ts` — Server-side Stripe instance
- Update results page for unlock gating

Acceptance: Checkout flow works, payment verified, content unlocked.

### Milestone 6: Full Report Sections + Exports
Files to create/modify:
- `src/components/ExperienceGaps.tsx`
- `src/components/CoverLetter.tsx`
- `src/components/SkillsSection.tsx`
- `src/lib/export.ts` — Generate text report
- Update results page to show all sections when unlocked

Acceptance: All differentiator sections render, download works, copy works.

### Milestone 7: Analytics + SEO + Polish
Files to create/modify:
- `src/lib/analytics.ts` — GA4 event helper
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- All pages: add metadata exports
- Add error boundaries
- Performance: lazy loading, dynamic imports

Acceptance: Events fire, sitemap valid, build passes, deploy-ready.

## Key Design Decisions

1. **Client-side parsing**: PDF/DOCX parsed in browser, only extracted text sent to server. Ensures no file storage.
2. **No user accounts**: Session-based with anonymous hashed IDs. Stripe handles payment identity.
3. **State in sessionStorage**: Analysis results stored client-side only. Lost on tab close (by design for privacy).
4. **One-time payment**: No subscriptions. Stripe Checkout in payment mode.
5. **Demo = static JSON**: No AI calls, instant render, clearly labeled sample data.
6. **A/B pricing via env var**: `NEXT_PUBLIC_PRICE_VARIANT` controls displayed price. Stripe price ID determines actual charge.
