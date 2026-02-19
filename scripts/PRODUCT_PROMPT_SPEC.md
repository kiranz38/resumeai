# ResumeMate AI — Product Prompt Spec

This is the core product spec for the AI engine. The production system prompt in `src/lib/llm/prompts/index.ts` implements all of these requirements.

## Core Principles

- Show value first before asking for payment (freemium-first model)
- Be practical, concise, and recruiter-realistic
- Optimize for ATS keyword alignment and human readability
- Never hallucinate experience or skills
- Never fabricate metrics unless user provides them
- Respect privacy — do not store or repeat user data
- Output must be structured and scannable

## Input

User provides:
- Resume text
- Job description

Optional (future):
- Target country
- Years of experience
- Target role

## Free Tier Output (Deterministic, no LLM)

Implemented in: `src/lib/ats-scorer.ts`, `src/app/api/analyze/route.ts`

1. **Resume Match Score (0-100)** — composite of skills match, keyword coverage, experience relevance, formatting
2. **Radar Score** — 5-dimension breakdown (hard skills, soft skills, measurable results, keyword optimization, formatting)
3. **Missing Keywords (Top 8+)** — ATS keywords from JD missing in resume
4. **Strengths (5 items)** — what the resume does well
5. **Gaps (7 items)** — what's missing or weak
6. **Rewrite Previews (3 pairs)** — before/after bullet rewrites as teaser
7. **Blocker Cards** — top 3 issues preventing interview callbacks

Soft CTA handled by `PaywallPlanPicker` component at bottom of results page + quick-checkout cards at top.

## Pro Tier Output (LLM-powered)

Implemented in: `src/lib/llm.ts`, `src/lib/llm-gateway.ts`, `src/app/api/generate-pro/route.ts`

### A. Complete Resume Rewrite
- Optimized professional headline
- Professional summary (2-3 lines, third person)
- Rewritten experience bullets with impact framing (Action verb + Scope + Outcome)
- Skills section grouped and reordered for ATS
- Education preserved verbatim

### B. ATS Keyword Optimization Checklist
- 10-15 keywords from JD
- Found/missing status
- Section where found
- Suggestions for missing keywords

### C. Tailored Cover Letter
- 4 paragraphs
- Tone: Professional, human, confident, not robotic
- Opening aligned to company mission/role
- Middle: concrete achievements mapped to JD
- Closing: professional interest + signoff with candidate name

### D. Recruiter Feedback (4-6 bullets)
- Specific to this candidate + this role

### E. Bullet Rewrites (Top 5 before/after pairs)
- With section reference and improvement notes

### F. Experience Gaps (2-4 items)
- Gap description, positioning suggestion, severity (high/medium/low)

### G. Next Actions (3-5 items)
- Actionable steps to improve candidacy

### H. Radar Scoring
- 4 dimensions: skillsMatch, experienceAlignment, impactStrength, atsReadiness
- Formula: overall = 0.30*skills + 0.30*experience + 0.25*impact + 0.15*ats

### I. Interview Talking Points (3-5 items)

## Writing Rules (enforced in system prompt)

- No emojis
- No marketing language
- No fluff or filler phrases
- No motivational speech
- Be recruiter-grade
- Use clear headings

## Guardrails

- If resume quality is poor, be honest but constructive
- If user lacks required experience, explain gap and suggest positioning strategies
- Never invent degrees, employers, or certifications
- STAR-style logic used internally but framework not exposed to user
- Factual data (companies, titles, dates, education) always extracted verbatim — never rephrased

## Banned Phrases (enforced by quality gate)

See `BANNED_PHRASES` in `src/lib/llm/prompts/index.ts` — includes filler like "measurable improvements", "dynamic environment", "leveraging best practices", template cover letter openers, and weak/generic phrases.
