#!/usr/bin/env npx tsx
/**
 * Diverse Country Test — runs resume+JD pairs from US, UK, AU, CA, NZ
 * through the /api/analyze endpoint and validates the output.
 *
 * Usage:
 *   npx tsx scripts/test-diverse.ts [baseUrl]
 *   Default baseUrl: http://localhost:3001
 */

const BASE_URL = process.argv[2] || "http://localhost:3001";

interface TestPair {
  country: string;
  profession: string;
  resumeText: string;
  jobDescriptionText: string;
  /** Things to check in the output */
  checks: {
    nameContains?: string;
    expectSkills?: string[];
    expectKeywords?: string[];
  };
}

const TEST_PAIRS: TestPair[] = [
  // ── 1. USA — Software Engineer ──
  {
    country: "US",
    profession: "Software Engineer",
    resumeText: `MICHAEL JOHNSON
Senior Software Engineer | San Francisco, CA 94102
michael.johnson@gmail.com | (415) 555-0198 | linkedin.com/in/michaeljohnson

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years building scalable web applications and distributed systems.

EXPERIENCE

Senior Software Engineer — Stripe Inc., San Francisco, CA (Mar 2021 – Present)
• Architected payment processing microservices handling $50B+ annual transaction volume
• Led migration from monolith to microservices architecture, reducing deployment time by 75%
• Mentored team of 5 junior engineers through structured code reviews and pair programming
• Implemented real-time fraud detection system using ML models, preventing $12M in annual losses

Software Engineer — Uber Technologies, San Francisco, CA (Jun 2018 – Feb 2021)
• Developed ride-matching algorithms optimizing for driver utilization and rider wait times
• Built data pipelines processing 500M events/day using Apache Kafka and Spark
• Reduced API response latency by 40% through Redis caching and query optimization
• Contributed to open-source internal tools adopted by 200+ engineers

Software Developer — TechCorp Inc., Austin, TX (Aug 2015 – May 2018)
• Built RESTful APIs using Python/Django serving 10M monthly active users
• Implemented automated testing framework achieving 90% code coverage
• Managed AWS infrastructure including EC2, RDS, S3, and Lambda

EDUCATION
M.S. Computer Science — Stanford University, 2015
B.S. Computer Science — University of Texas at Austin, 2013

SKILLS
Python, Go, Java, TypeScript, React, Node.js, PostgreSQL, Redis, Apache Kafka, Spark, Docker, Kubernetes, AWS, Terraform, CI/CD, System Design`,
    jobDescriptionText: `Staff Engineer — Coinbase (Remote, US)

About the Role:
Join our Platform Engineering team to design and build the infrastructure that powers the world's leading cryptocurrency exchange.

Requirements:
• 7+ years of software engineering experience
• Expert in Go or Python for high-performance backend systems
• Deep experience with distributed systems and event-driven architectures
• Experience with Kubernetes, Docker, and cloud-native infrastructure
• Strong database expertise (PostgreSQL, DynamoDB, or similar)
• Experience with real-time data processing at scale
• Track record of technical leadership and mentoring
• Strong system design and architecture skills

Nice to Have:
• Experience with blockchain or cryptocurrency systems
• Background in financial services or payment processing
• Experience with Terraform and infrastructure-as-code
• Contributions to open-source projects`,
    checks: {
      nameContains: "Michael",
      expectSkills: ["Python", "Go", "Kubernetes"],
      expectKeywords: ["distributed systems", "Kubernetes"],
    },
  },

  // ── 2. UK — Marketing Manager ──
  {
    country: "UK",
    profession: "Marketing Manager",
    resumeText: `CHARLOTTE DAVIES
Digital Marketing Manager
charlotte.davies@outlook.co.uk | 07912 345678 | London, United Kingdom
linkedin.com/in/charlottedavies

PROFILE
Award-winning digital marketing professional with expertise in B2B SaaS demand generation and brand strategy across EMEA markets.

EXPERIENCE

Digital Marketing Manager — Monzo Bank Ltd, London (Sept 2021 – Present)
• Managed £400K annual digital advertising budget across Google, Meta, and LinkedIn
• Grew organic website traffic by 180% year-on-year through SEO programme and content strategy
• Led rebranding initiative including new website launch, increasing lead generation by 55%
• Built and optimised email nurture sequences achieving 38% open rate and 9% CTR
• Reduced customer acquisition cost by 35% through channel mix optimisation
• Line-managed team of 3 content writers and 1 graphic designer

Marketing Executive — Deliveroo plc, London (Jan 2019 – Aug 2021)
• Executed social media campaigns across 12 B2B restaurant partner verticals
• Created 150+ pieces of content including blog posts, whitepapers, and case studies
• Managed Google Ads campaigns with combined monthly spend of £150K
• Implemented HubSpot marketing automation for partner onboarding programme
• Organised quarterly partner appreciation events with 200+ attendees

Marketing Coordinator — TechHub Coworking Ltd, London (Jun 2017 – Dec 2018)
• Supported event marketing for 6 annual conferences with 400+ attendees each
• Managed social media accounts growing followers by 250% in 12 months
• Created monthly marketing reports tracking campaign performance in Tableau

EDUCATION
BA (Hons) Marketing — University of Manchester, 2017
CIM Level 6 Diploma in Professional Marketing, 2019

SKILLS
Google Ads, Meta Ads, LinkedIn Campaign Manager, SEO/SEM, HubSpot, Salesforce, Google Analytics 4, Tableau, Content Strategy, Email Marketing, A/B Testing, Copywriting, GDPR Compliance`,
    jobDescriptionText: `Head of Marketing — Revolut Ltd (London, UK)

About the Role:
We're looking for a Head of Marketing to scale our B2B marketing function across EMEA. You'll own demand generation, brand, content, and product marketing for our business banking platform.

Requirements:
• 6+ years in B2B SaaS marketing, 3+ in a leadership role
• Proven experience scaling demand generation across EMEA markets
• Deep expertise in digital advertising (Google, LinkedIn, programmatic)
• Experience building and managing marketing teams (5+ people)
• Strong understanding of marketing analytics and attribution modelling
• Experience with marketing automation platforms (HubSpot or Marketo)
• Track record of successful product launches and go-to-market strategies
• Understanding of GDPR and data privacy regulations

Nice to Have:
• Experience marketing fintech or banking products
• Background in product-led growth (PLG) marketing
• Experience with ABM (account-based marketing) strategies
• Knowledge of the European regulatory landscape`,
    checks: {
      nameContains: "Charlotte",
      expectSkills: ["HubSpot", "Google Ads", "LinkedIn"],
      expectKeywords: ["EMEA", "demand generation"],
    },
  },

  // ── 3. Australia — Project Manager ──
  {
    country: "AU",
    profession: "Project Manager",
    resumeText: `JAMES WILSON
Senior Project Manager
james.wilson@bigpond.com.au | 0412 345 678 | Sydney, NSW 2000
linkedin.com/in/jameswilsonau

CAREER SUMMARY
PMP-certified project manager with 10+ years delivering complex IT and construction projects across government and private sectors in Australia.

EXPERIENCE

Senior Project Manager — Telstra Corporation Ltd, Sydney, NSW (Feb 2020 – Present)
• Led delivery of $15M network infrastructure upgrade programme across regional NSW
• Managed cross-functional team of 25 engineers, contractors, and business analysts
• Delivered 12 projects on time and within budget over 3 financial years
• Implemented Agile/SAFe methodology across 3 project streams, improving delivery velocity by 30%
• Managed stakeholder relationships with State Government and local councils
• Established project governance framework adopted as organisational standard

Project Manager — Woolworths Group Ltd, Sydney, NSW (Mar 2017 – Jan 2020)
• Managed $8M retail technology modernisation programme across 200+ stores
• Coordinated vendor selection and contract negotiation saving $1.2M against budget
• Led change management programme for point-of-sale system rollout
• Delivered fortnightly steering committee presentations to C-suite executives
• Achieved 95% stakeholder satisfaction score across all managed projects

Assistant Project Manager — Lendlease Pty Ltd, Sydney, NSW (Jul 2014 – Feb 2017)
• Supported delivery of $50M commercial building project in Barangaroo precinct
• Managed subcontractor schedules and procurement for 15+ trade packages
• Maintained project risk registers and escalation procedures
• Prepared monthly progress reports for client and senior leadership

EDUCATION
Master of Project Management — University of Sydney, 2014
Bachelor of Civil Engineering (Honours) — University of New South Wales, 2012

CERTIFICATIONS
Project Management Professional (PMP) — PMI
PRINCE2 Practitioner
SAFe 5.0 Agilist

SKILLS
Project Governance, Stakeholder Management, Agile/SAFe, PRINCE2, PMP, Risk Management, Vendor Management, Budgeting & Forecasting, Microsoft Project, Jira, Confluence, Power BI, Change Management`,
    jobDescriptionText: `Programme Director — Commonwealth Bank of Australia (Sydney, NSW)

About the Role:
Lead a portfolio of strategic technology transformation programmes valued at $50M+ within our Technology division. You'll oversee multiple project managers and ensure alignment with CBA's digital strategy.

Requirements:
• 10+ years of project/programme management experience
• PMP, PRINCE2, or equivalent certification
• Experience delivering large-scale IT transformation programmes ($10M+)
• Strong stakeholder management skills at executive and board level
• Experience with Agile/SAFe delivery at enterprise scale
• Financial services or banking industry experience preferred
• Strong risk management and governance capability
• Experience managing teams of 20+ across multiple workstreams

Nice to Have:
• Experience with cloud migration or digital transformation programmes
• SAFe Program Consultant (SPC) certification
• Experience with Australian Government IT procurement frameworks
• Background in regulatory compliance (APRA, ASIC)`,
    checks: {
      nameContains: "James",
      expectSkills: ["PMP", "Agile", "PRINCE2"],
      expectKeywords: ["programme", "stakeholder management"],
    },
  },

  // ── 4. Canada — Data Analyst ──
  {
    country: "CA",
    profession: "Data Analyst",
    resumeText: `SARAH TREMBLAY
Senior Data Analyst
sarah.tremblay@gmail.com | (514) 555-0134 | Montréal, QC, Canada
linkedin.com/in/sarahtremblay

SUMMARY
Bilingual (English/French) data analyst with 6+ years of experience in financial services, specializing in business intelligence, predictive modelling, and data-driven decision making.

EXPERIENCE

Senior Data Analyst — Shopify Inc., Ottawa, ON (Jan 2022 – Present)
• Built merchant analytics dashboard used by 10,000+ Shopify Plus merchants
• Developed churn prediction model achieving 0.87 AUC-ROC, enabling proactive retention outreach
• Automated weekly executive reporting pipeline, saving 15 hours/month of manual effort
• Designed A/B testing framework for pricing experiments impacting $200M annual revenue
• Collaborated with product and engineering teams to define KPIs for new marketplace features

Data Analyst — Royal Bank of Canada (RBC), Montréal, QC (Mar 2019 – Dec 2021)
• Analysed customer transaction patterns across 5M+ accounts for anti-money laundering compliance
• Built interactive Tableau dashboards for wealth management division executives
• Developed credit risk scoring models reducing default prediction error by 22%
• Presented quarterly findings to VP-level stakeholders across risk and compliance
• Maintained data quality standards across 12 enterprise data sources

Junior Data Analyst — Bombardier Inc., Montréal, QC (Sep 2017 – Feb 2019)
• Created supply chain analytics reports tracking 500+ parts across global manufacturing
• Automated inventory forecasting using Python, reducing stockout incidents by 30%
• Supported finance team with variance analysis and monthly P&L reconciliation

EDUCATION
M.Sc. Data Science — McGill University, 2017
B.Sc. Mathematics and Statistics — Université de Montréal, 2015

SKILLS
Python, R, SQL, Tableau, Power BI, Looker, Pandas, Scikit-learn, TensorFlow, Spark, Snowflake, AWS Redshift, dbt, Git, A/B Testing, Statistical Modelling, ETL Pipelines`,
    jobDescriptionText: `Lead Data Analyst — Wealthsimple (Toronto, ON, Canada)

About the Role:
Own the analytics function for our investing platform. You'll build the data infrastructure, mentor a team of analysts, and drive data-informed product decisions.

Requirements:
• 5+ years of data analysis experience, preferably in fintech or financial services
• Expert in SQL and Python for data analysis
• Experience with modern data stack (dbt, Snowflake, Looker, or similar)
• Strong statistical modelling and A/B testing expertise
• Experience building dashboards and self-serve analytics tools
• Excellent data storytelling and stakeholder communication skills
• Experience mentoring junior analysts
• Familiarity with Canadian financial regulations (OSFI, FINTRAC)

Nice to Have:
• Experience with machine learning for financial applications
• Background in investment or wealth management analytics
• Bilingual (English/French) is an asset
• Experience with real-time data pipelines (Kafka, Kinesis)`,
    checks: {
      nameContains: "Sarah",
      expectSkills: ["Python", "SQL", "Tableau"],
      expectKeywords: ["Snowflake", "A/B testing"],
    },
  },

  // ── 5. New Zealand — Registered Nurse ──
  {
    country: "NZ",
    profession: "Registered Nurse",
    resumeText: `AROHA MITCHELL, RN
Registered Nurse
aroha.mitchell@xtra.co.nz | 021 456 789 | Auckland, New Zealand
Nursing Council of New Zealand Registration: 12345

CAREER PROFILE
Compassionate and culturally responsive registered nurse with 7+ years of experience in acute care and community health settings across Aotearoa New Zealand. Strong advocate for Te Tiriti o Waitangi principles in healthcare delivery.

EXPERIENCE

Clinical Nurse Specialist — Auckland District Health Board (ADHB), Auckland (Mar 2021 – Present)
• Provide specialist nursing care in 40-bed acute medical ward
• Manage complex patient caseload of 8-10 patients per shift including respiratory, cardiac, and renal presentations
• Lead quality improvement programme reducing medication errors by 45% over 12 months
• Precept 4 new graduate nurses per year through the Nurse Entry to Practice (NETP) programme
• Coordinate multidisciplinary team meetings with physicians, physiotherapists, and social workers
• Champion cultural safety initiatives aligned with He Korowai Oranga (Māori Health Strategy)

Registered Nurse — Waikato District Health Board, Hamilton (Feb 2018 – Feb 2021)
• Provided direct patient care on 25-bed surgical ward
• Administered medications and IV therapies following best practice guidelines
• Managed post-operative care for orthopaedic and general surgery patients
• Served as charge nurse 2-3 shifts per week coordinating ward operations
• Completed Advanced Cardiac Life Support (ACLS) certification
• Participated in DHB-wide falls prevention programme

Enrolled Nurse — Mercy Hospital, Auckland (Jan 2016 – Jan 2018)
• Provided personal care and vital sign monitoring under RN supervision
• Assisted with wound care and dressing changes
• Documented patient observations using MedChart electronic prescribing system

EDUCATION
Bachelor of Nursing — Auckland University of Technology (AUT), 2016
Postgraduate Certificate in Clinical Nursing — University of Auckland, 2020

CERTIFICATIONS
Registered Nurse — Nursing Council of New Zealand
Advanced Cardiac Life Support (ACLS)
Basic Life Support (BLS)
Vaccinator Authorisation — Ministry of Health NZ
Te Reo Māori Certificate (Level 3)

SKILLS
Acute Care, Medication Management, Wound Care, Patient Assessment, Cultural Safety, Te Tiriti o Waitangi, MedChart, Clinical Documentation, Quality Improvement, Patient Education, Infection Control, Palliative Care`,
    jobDescriptionText: `Nurse Manager — Te Whatu Ora (Health New Zealand), Wellington

About the Role:
Lead a team of 30 nursing staff across our acute medical and surgical wards. You'll be responsible for clinical governance, staff development, and ensuring culturally safe care delivery.

Requirements:
• 5+ years of nursing experience in acute care settings in New Zealand
• Current Nursing Council of New Zealand registration
• Demonstrated leadership experience (charge nurse, CNS, or similar)
• Commitment to Te Tiriti o Waitangi and culturally safe practice
• Experience with quality improvement and clinical governance
• Strong understanding of NZ health sector (Te Whatu Ora structure)
• Experience precepting and mentoring nursing staff
• ACLS and BLS certification

Nice to Have:
• Postgraduate qualification in nursing or health management
• Experience with MedChart or similar e-prescribing systems
• Te Reo Māori proficiency
• Experience in Māori or Pacific health service delivery
• Background in change management within healthcare`,
    checks: {
      nameContains: "Aroha",
      expectSkills: ["Acute Care", "Cultural Safety"],
      expectKeywords: ["Te Tiriti", "quality improvement"],
    },
  },
];

// ── Runner ──

interface AnalyzeResponse {
  atsResult: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    warnings: string[];
  };
  candidateProfile: {
    name?: string;
    skills: string[];
    experience: Array<{ company?: string; title?: string; bullets: string[] }>;
    education: Array<{ school?: string; degree?: string }>;
  };
  jobProfile: {
    title?: string;
    company?: string;
    requiredSkills: string[];
    keywords: string[];
  };
  strengths: string[];
  gaps: string[];
  rewritePreviews: Array<{ original: string; improved: string }>;
  radarResult?: {
    score: number;
    label: string;
    breakdown: Record<string, number>;
    blockers: Array<{ title: string }>;
  };
}

async function runTest(pair: TestPair, index: number): Promise<{ pass: boolean; issues: string[] }> {
  const label = `[${index + 1}/${TEST_PAIRS.length}] ${pair.country} — ${pair.profession}`;
  console.log(`\n${label}`);
  console.log("─".repeat(50));

  const issues: string[] = [];

  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: pair.resumeText,
        jobDescriptionText: pair.jobDescriptionText,
      }),
    });

    if (!res.ok) {
      issues.push(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
      console.log(`  FAIL: ${issues[0]}`);
      return { pass: false, issues };
    }

    const data: AnalyzeResponse = await res.json();

    // Check name parsed
    if (pair.checks.nameContains) {
      if (data.candidateProfile.name?.toLowerCase().includes(pair.checks.nameContains.toLowerCase())) {
        console.log(`  Name: "${data.candidateProfile.name}" ✓`);
      } else {
        issues.push(`Name "${data.candidateProfile.name}" missing "${pair.checks.nameContains}"`);
        console.log(`  Name: "${data.candidateProfile.name}" ✗ (expected "${pair.checks.nameContains}")`);
      }
    }

    // Check experience parsed
    const expCount = data.candidateProfile.experience.length;
    console.log(`  Experience roles: ${expCount} ${expCount >= 2 ? "✓" : "✗"}`);
    if (expCount < 2) issues.push(`Only ${expCount} experience roles parsed`);
    for (const exp of data.candidateProfile.experience) {
      console.log(`    → ${exp.title || "?"} at ${exp.company || "?"} (${exp.bullets.length} bullets)`);
    }

    // Check education parsed
    const eduCount = data.candidateProfile.education.length;
    console.log(`  Education: ${eduCount} ${eduCount >= 1 ? "✓" : "✗"}`);
    if (eduCount < 1) issues.push("No education parsed");

    // Check skills
    const skillCount = data.candidateProfile.skills.length;
    console.log(`  Skills: ${skillCount} ${skillCount >= 5 ? "✓" : "✗"}`);
    if (skillCount < 5) issues.push(`Only ${skillCount} skills parsed`);

    // Check expected skills found
    if (pair.checks.expectSkills) {
      const candidateSkillsLower = data.candidateProfile.skills.map((s) => s.toLowerCase());
      for (const expected of pair.checks.expectSkills) {
        const found = candidateSkillsLower.some((s) => s.includes(expected.toLowerCase()));
        if (!found) {
          issues.push(`Expected skill "${expected}" not found in parsed skills`);
          console.log(`  Skill "${expected}": ✗ missing`);
        }
      }
    }

    // Check ATS score
    console.log(`  ATS Score: ${data.atsResult.score}/100`);
    if (data.atsResult.score < 10) issues.push(`ATS score suspiciously low: ${data.atsResult.score}`);
    if (data.atsResult.score > 95) issues.push(`ATS score suspiciously high: ${data.atsResult.score}`);

    // Check radar
    if (data.radarResult) {
      console.log(`  Radar: ${data.radarResult.score}/100 (${data.radarResult.label})`);
      console.log(`    Hard Skills: ${data.radarResult.breakdown.hardSkills} | Soft Skills: ${data.radarResult.breakdown.softSkills} | Results: ${data.radarResult.breakdown.measurableResults} | Keywords: ${data.radarResult.breakdown.keywordOptimization} | Formatting: ${data.radarResult.breakdown.formattingBestPractices}`);
      if (data.radarResult.blockers.length > 0) {
        console.log(`    Blockers: ${data.radarResult.blockers.map((b) => b.title).join(", ")}`);
      }
    } else {
      issues.push("No radar result");
    }

    // Check matched/missing keywords
    console.log(`  Keywords — matched: ${data.atsResult.matchedKeywords.length}, missing: ${data.atsResult.missingKeywords.length}`);
    if (pair.checks.expectKeywords) {
      const allKw = [...data.atsResult.matchedKeywords, ...data.atsResult.missingKeywords].map((k) => k.toLowerCase());
      for (const expected of pair.checks.expectKeywords) {
        const found = allKw.some((k) => k.includes(expected.toLowerCase()));
        if (!found) console.log(`    Keyword "${expected}" not in matched or missing list`);
      }
    }

    // Check rewrite previews
    console.log(`  Rewrite previews: ${data.rewritePreviews.length}`);
    if (data.rewritePreviews.length > 0) {
      const p = data.rewritePreviews[0];
      console.log(`    Before: "${p.original.slice(0, 60)}..."`);
      console.log(`    After:  "${p.improved.slice(0, 60)}..."`);
    }

    // Check strengths/gaps
    console.log(`  Strengths: ${data.strengths.length} | Gaps: ${data.gaps.length}`);

    // Check job profile parsed
    console.log(`  Job: "${data.jobProfile.title}" at "${data.jobProfile.company}"`);
    if (!data.jobProfile.title) issues.push("Job title not parsed");

    const pass = issues.length === 0;
    console.log(`\n  Result: ${pass ? "PASS ✓" : `FAIL ✗ (${issues.length} issues)`}`);
    return { pass, issues };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    issues.push(`Network error: ${msg}`);
    console.log(`  FAIL: ${msg}`);
    return { pass: false, issues };
  }
}

async function main() {
  console.log(`=== Diverse Country Test Suite ===`);
  console.log(`Testing against: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;
  const allIssues: Array<{ country: string; issues: string[] }> = [];

  for (let i = 0; i < TEST_PAIRS.length; i++) {
    const pair = TEST_PAIRS[i];
    const result = await runTest(pair, i);
    if (result.pass) {
      passed++;
    } else {
      failed++;
      allIssues.push({ country: `${pair.country} — ${pair.profession}`, issues: result.issues });
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${TEST_PAIRS.length}`);

  if (allIssues.length > 0) {
    console.log("\nIssues:");
    for (const { country, issues } of allIssues) {
      console.log(`  ${country}:`);
      for (const issue of issues) {
        console.log(`    - ${issue}`);
      }
    }
  }

  console.log("\nCountries tested: US, UK, AU, CA, NZ");
  process.exit(failed > 0 ? 1 : 0);
}

main();
