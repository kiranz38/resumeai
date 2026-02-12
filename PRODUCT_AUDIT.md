# Product Audit — Resume Tailor

## Repo State (2026-02-12)

### Framework & Stack
- **Next.js**: 16.1.6 (App Router, `src/app/` directory)
- **React**: 19.2.3
- **TypeScript**: ^5
- **Tailwind CSS**: v4 (with `@tailwindcss/postcss`)
- **Node**: Windows 11 environment

### Installed Dependencies
| Package | Purpose |
|---------|---------|
| zod | Schema validation for AI responses |
| pdfjs-dist | Client-side PDF text extraction |
| mammoth | DOCX to text conversion |
| stripe | Server-side Stripe API |
| @stripe/stripe-js | Client-side Stripe Checkout redirect |

### Existing Code
- Fresh `create-next-app` scaffold only
- No existing analytics, Stripe, AI, or parsing code
- No existing pages beyond default `page.tsx`
- No tests configured

### Directory Structure
```
src/
  app/
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
public/
  (default Next.js assets)
```

### What Needs to Be Built (Everything)
1. All 9 routes (/, /analyze, /results, /demo, /pricing, /how-it-works, /privacy, /terms, /contact)
2. Component library (header, footer, score displays, keyword maps, etc.)
3. Resume parsing pipeline (PDF, DOCX, TXT)
4. AI integration endpoint with zod-validated response schema
5. Demo mode with static precomputed data
6. Stripe Checkout integration (create session + verify)
7. Results UI with free preview + paid unlock gating
8. Full report sections (all 8 differentiators)
9. Analytics event system (GA4)
10. SEO (sitemap, robots, OG tags, metadata)
11. Legal pages (privacy, terms)
12. Export functionality (copy, download txt report)
13. Unit + E2E tests

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| pdfjs-dist bundle size | Use dynamic import + Web Worker |
| AI response latency | Streaming UI progress, timeout handling |
| Stripe webhook reliability | Use polling verify endpoint as fallback |
| PDF parsing accuracy | Offer paste-text fallback prominently |

### Environment Variables Required
```
ANTHROPIC_API_KEY=         # Claude API for analysis
STRIPE_SECRET_KEY=         # Stripe server key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe client key
STRIPE_PRICE_ID=           # One-time payment price ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=       # GA4
NEXT_PUBLIC_ENABLE_JD_URL=false      # Feature flag: JD URL fetch
NEXT_PUBLIC_PRICE_VARIANT=12         # A/B pricing: 9, 12, or 15
```
