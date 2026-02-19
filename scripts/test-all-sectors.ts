#!/usr/bin/env npx tsx
/**
 * All-Sectors Test Suite — 18 resume/JD pairs covering every major
 * employment sector based on BLS labor force data.
 *
 * Sectors: Healthcare, Retail, Hospitality, Education, Trades,
 * Manufacturing, Finance, Logistics, Government, Legal, HR, Accounting,
 * Creative/Design, Sales, Customer Service, Social Work, Real Estate,
 * Construction Management.
 *
 * Usage:
 *   npx tsx scripts/test-all-sectors.ts [baseUrl]
 *   Default baseUrl: http://localhost:3001
 */

const BASE_URL = process.argv[2] || "http://localhost:3001";

interface TestPair {
  country: string;
  sector: string;
  profession: string;
  resumeText: string;
  jobDescriptionText: string;
  checks: {
    nameContains?: string;
    minExperience?: number;
    expectSkills?: string[];
    expectKeywords?: string[];
  };
}

const TEST_PAIRS: TestPair[] = [
  // ── 1. HEALTHCARE — Pharmacist (UK) ──
  {
    country: "UK",
    sector: "Healthcare",
    profession: "Pharmacist",
    resumeText: `PRIYA SHARMA MPharm, MRPharmS
Clinical Pharmacist | London, United Kingdom
priya.sharma@nhs.net | 07845 123456

PROFESSIONAL SUMMARY
GPhC-registered pharmacist with 7 years of experience in hospital and community pharmacy settings across the NHS.

EXPERIENCE

Senior Clinical Pharmacist — Guy's and St Thomas' NHS Foundation Trust, London (Apr 2021 – Present)
• Led medicines reconciliation programme across 4 surgical wards, reducing prescribing errors by 28%
• Managed anticoagulation clinic for 200+ patients, achieving 92% time-in-therapeutic-range
• Supervised and mentored 3 pre-registration pharmacists through their training year
• Implemented electronic prescribing system rollout across 6 departments

Clinical Pharmacist — Royal Free London NHS Foundation Trust (Sep 2018 – Mar 2021)
• Provided pharmaceutical care to patients on acute medical wards (40-bed unit)
• Conducted medication reviews identifying average 3.2 interventions per patient
• Collaborated with multidisciplinary teams on antimicrobial stewardship rounds
• Delivered training sessions on insulin safety to 50+ nursing staff

Pre-registration Pharmacist — Boots UK Ltd, London (Aug 2017 – Aug 2018)
• Completed 52-week training programme achieving first-time GPhC registration
• Dispensed average 250 prescriptions daily with zero critical errors
• Provided MUR (Medicines Use Review) consultations to elderly patients

EDUCATION
Master of Pharmacy (MPharm) — University College London, 2017

CERTIFICATIONS
GPhC Registration (General Pharmaceutical Council)
Independent Prescriber (IP) qualification
Medicines Optimisation Certificate

SKILLS
Clinical Pharmacy, Medicines Reconciliation, Anticoagulation Management, Antimicrobial Stewardship, Electronic Prescribing, Patient Counselling, GPhC Registered, Formulary Management, CPD, NHS Systems`,
    jobDescriptionText: `Lead Pharmacist — King's College Hospital NHS Foundation Trust (London, UK)

About King's College Hospital:
One of the UK's largest teaching hospitals, part of King's Health Partners academic health sciences centre.

Role:
We are looking for an experienced Lead Pharmacist to oversee clinical pharmacy services within our Acute Medicine division.

Responsibilities:
• Lead a team of 6 clinical pharmacists across acute admission and short-stay units
• Develop and implement medicines optimisation strategies aligned with NICE guidelines
• Chair the divisional Medicines Safety Committee
• Provide clinical leadership on antimicrobial stewardship and sepsis management
• Support the introduction of electronic prescribing and medicines administration (EPMA)
• Mentor junior pharmacists and pre-registration trainees

Requirements:
• MPharm or equivalent with current GPhC registration
• Minimum 5 years post-registration hospital pharmacy experience
• Independent Prescriber (IP) qualification
• Demonstrable experience in medicines optimisation and clinical governance
• Experience leading or managing a pharmacy team
• Knowledge of NICE guidelines and NHS medicines policy

Nice to have:
• Postgraduate diploma in clinical pharmacy
• Experience with EPMA systems (e.g., JAC, EMIS)
• Published research or QI projects in pharmacy practice`,
    checks: {
      nameContains: "Priya",
      minExperience: 3,
      expectSkills: ["Clinical Pharmacy", "Antimicrobial"],
      expectKeywords: ["GPhC", "medicines"],
    },
  },

  // ── 2. RETAIL — Store Manager (US) ──
  {
    country: "US",
    sector: "Retail",
    profession: "Store Manager",
    resumeText: `MARCUS JEFFERSON
Retail Store Manager | Chicago, IL 60614
marcus.jefferson@gmail.com | (312) 555-0187

PROFESSIONAL SUMMARY
Results-oriented retail manager with 9 years of experience driving sales, managing teams, and optimizing store operations in high-volume environments.

EXPERIENCE

Store Manager — Target Corporation, Chicago, IL (Jun 2020 – Present)
• Manage $18M annual revenue store with 85 team members across 5 departments
• Increased same-store sales by 12% YoY through improved merchandising and customer engagement
• Reduced employee turnover from 68% to 41% through enhanced onboarding and recognition programs
• Achieved #3 ranking out of 42 district stores for customer satisfaction scores (NPS 78)
• Managed inventory shrinkage below 1.2%, consistently outperforming district average of 1.8%

Assistant Store Manager — Nordstrom Inc., Chicago, IL (Mar 2017 – May 2020)
• Oversaw daily operations for $12M revenue location with 45 associates
• Drove 15% increase in loyalty program sign-ups through staff training initiatives
• Coordinated seasonal merchandising displays resulting in 22% uplift in featured category sales
• Handled escalated customer complaints, maintaining 95% resolution satisfaction rate

Department Supervisor — Macy's Inc., Chicago, IL (Jan 2015 – Feb 2017)
• Supervised team of 12 sales associates in Men's department
• Exceeded monthly sales targets by average 8% over 24 consecutive months
• Trained new hires on POS systems, loss prevention, and customer service standards

EDUCATION
Bachelor of Business Administration — University of Illinois at Chicago, 2014

SKILLS
P&L Management, Visual Merchandising, Team Leadership, Inventory Management, Customer Experience, Loss Prevention, POS Systems, Workforce Scheduling, Sales Forecasting, KPI Analysis, Conflict Resolution, Vendor Relations`,
    jobDescriptionText: `District Manager — Costco Wholesale (Midwest Region)

About Costco:
Costco Wholesale is a multi-billion dollar global retailer with 600+ warehouse locations.

Role:
Seeking an experienced retail leader to oversee 8-10 Costco warehouse locations across the Chicago metro area.

Responsibilities:
• Drive sales performance and profitability across assigned district
• Recruit, develop, and retain warehouse management teams
• Ensure compliance with Costco operational standards and safety regulations
• Analyze P&L statements and implement corrective actions for underperforming locations
• Lead district-wide merchandising and promotional strategies
• Conduct regular store visits and operational audits

Requirements:
• 7+ years of retail management experience, including multi-unit oversight
• Proven track record of driving sales growth and improving operational metrics
• Strong P&L management and financial analysis skills
• Experience managing teams of 50+ employees
• Bachelor's degree in Business Administration or related field
• Proficiency in retail analytics and inventory management systems

Preferred:
• Experience in warehouse/club retail format
• Knowledge of supply chain and distribution operations
• Bilingual (English/Spanish) preferred`,
    checks: {
      nameContains: "Marcus",
      minExperience: 3,
      expectSkills: ["P&L Management", "Inventory Management"],
      expectKeywords: ["merchandising", "sales"],
    },
  },

  // ── 3. HOSPITALITY — Hotel Operations Manager (AU) ──
  {
    country: "AU",
    sector: "Hospitality",
    profession: "Hotel Operations Manager",
    resumeText: `EMMA NGUYEN
Hotel Operations Manager | Melbourne, VIC 3000
emma.nguyen@outlook.com.au | 0423 456 789

CAREER SUMMARY
Hospitality professional with 8 years of experience managing hotel operations, revenue optimisation, and guest experience across 4- and 5-star properties in Australia.

EXPERIENCE

Operations Manager — Crown Towers Melbourne, Crown Resorts Ltd, Melbourne, VIC (Feb 2021 – Present)
• Oversee daily operations for 481-room luxury hotel generating $65M annual revenue
• Manage cross-functional team of 120+ staff across front office, housekeeping, and F&B
• Improved guest satisfaction scores from 8.4 to 9.1 on Booking.com through service recovery initiatives
• Led $2.5M rooms renovation project delivered on time and 8% under budget
• Implemented dynamic pricing strategy increasing RevPAR by 18% during shoulder season

Duty Manager — Sofitel Melbourne on Collins, Accor Hotels (Jan 2018 – Jan 2021)
• Managed nightly operations for 363-room property ensuring seamless guest experience
• Resolved average 15 guest complaints per week with 97% satisfaction resolution rate
• Coordinated with events team for conferences and weddings generating $4.2M annually
• Trained 25+ new team members on Opera PMS and Accor service standards

Guest Relations Supervisor — Hilton Melbourne South Wharf (Mar 2016 – Dec 2017)
• Supervised front desk team of 8 across three shifts
• Achieved 92% upsell conversion rate on room upgrades and packages
• Managed VIP and loyalty programme guests ensuring personalised service delivery

EDUCATION
Bachelor of Business (Hospitality Management) — La Trobe University, Melbourne, 2015

SKILLS
Revenue Management, Opera PMS, Guest Experience, P&L Accountability, Housekeeping Operations, F&B Coordination, Dynamic Pricing, Events Management, Staff Training, WHS Compliance, Budgeting, Vendor Management`,
    jobDescriptionText: `General Manager — Marriott International (Sydney CBD, NSW)

About the Role:
Marriott International is seeking an experienced General Manager for our flagship Sheraton Grand Sydney Hyde Park property (558 rooms).

Responsibilities:
• Full P&L responsibility for hotel operations including rooms, F&B, events, and spa
• Lead and inspire a team of 200+ across all departments
• Drive revenue growth through strategic pricing, channel management, and group sales
• Maintain Marriott brand standards and ensure compliance with Australian hospitality regulations
• Oversee capital expenditure projects and property maintenance
• Build relationships with corporate accounts and tourism bodies

Requirements:
• 8+ years of progressive hotel management experience
• Previous experience as Operations Manager or Hotel Manager for a 300+ room property
• Strong financial acumen with P&L management experience
• Knowledge of revenue management systems and strategies
• Tertiary qualification in Hospitality Management or related field
• Current RSA (Responsible Service of Alcohol) certification

Preferred:
• Experience with Marriott or comparable international hotel chain
• Familiarity with Opera PMS, Marriott MARSHA, and revenue management systems
• Experience in the Australian hospitality market`,
    checks: {
      nameContains: "Emma",
      minExperience: 3,
      expectSkills: ["Revenue Management", "Opera PMS"],
      expectKeywords: ["hospitality", "P&L"],
    },
  },

  // ── 4. EDUCATION — Secondary Teacher (AU) ──
  {
    country: "AU",
    sector: "Education",
    profession: "Secondary Teacher",
    resumeText: `DANIEL O'BRIEN
Secondary Mathematics Teacher | Brisbane, QLD 4000
daniel.obrien@eq.edu.au | 0412 789 456

CAREER SUMMARY
Registered teacher (QCT) with 6 years of experience teaching secondary mathematics and science across Years 7-12 in Queensland state schools.

EXPERIENCE

Mathematics Teacher (Head of Department) — Indooroopilly State High School, Brisbane, QLD (Jan 2022 – Present)
• Lead mathematics department of 8 teachers delivering curriculum to 900+ students Years 7-12
• Increased Year 12 Mathematical Methods cohort achievement from 72% to 84% in OP-eligible grades
• Implemented differentiated instruction strategies raising Year 9 NAPLAN numeracy results by 15%
• Coordinated annual maths competition team (AMC) with 3 students achieving High Distinction
• Mentored 2 beginning teachers through their first year of full registration

Mathematics & Science Teacher — Kenmore State High School, Brisbane, QLD (Jan 2019 – Dec 2021)
• Taught General Mathematics, Mathematical Methods, and Junior Science to 150+ students
• Designed and delivered STEM enrichment programme integrating coding with mathematical concepts
• Achieved student satisfaction rating of 4.6/5.0 in annual school survey
• Supervised extracurricular robotics club and science fair entries

Graduate Teacher — Ipswich State High School, Ipswich, QLD (Jan 2018 – Dec 2018)
• Completed Transition to Teaching programme under mentor supervision
• Taught Years 7-10 Mathematics across ability-streamed classes
• Developed assessment rubrics aligned with Australian Curriculum (ACARA)

EDUCATION
Bachelor of Education (Secondary) — University of Queensland, 2017
Major: Mathematics, Minor: Science

CERTIFICATIONS
Queensland College of Teachers (QCT) Full Registration
Working with Children Check (Blue Card)
First Aid Certificate (HLTAID011)

SKILLS
Curriculum Development, Differentiated Instruction, NAPLAN Preparation, ACARA Alignment, STEM Education, Classroom Management, Student Assessment, Data-Driven Teaching, IEP Development, Parent Communication, OneSchool, ICT Integration`,
    jobDescriptionText: `Head of Mathematics — Brisbane Grammar School (Brisbane, QLD)

About Brisbane Grammar School:
Brisbane Grammar School is a leading independent boys' school with a tradition of academic excellence since 1868.

Role:
We seek an experienced and passionate Head of Mathematics to lead our Mathematics Faculty.

Responsibilities:
• Provide academic and pedagogical leadership to a faculty of 12 teachers
• Oversee curriculum design and assessment for Years 7-12 Mathematics
• Drive continuous improvement in student outcomes, including ATAR results
• Manage faculty budget, resources, and professional development programme
• Coordinate QCS/external assessment preparation and moderation
• Foster a culture of innovation in mathematics teaching and learning

Requirements:
• Current QCT registration and eligibility to teach Mathematics to Year 12
• Minimum 5 years of secondary mathematics teaching experience
• Demonstrated leadership in curriculum development or department coordination
• Strong understanding of QCAA Senior Mathematics syllabi
• Experience with data analysis to inform teaching practice
• Relevant tertiary qualifications in Mathematics and Education

Preferred:
• Experience in an independent school setting
• Postgraduate qualification in Mathematics Education
• Involvement in mathematics competitions (AMC, ICAS, Olympiad)`,
    checks: {
      nameContains: "Daniel",
      minExperience: 3,
      expectSkills: ["Curriculum Development", "STEM"],
      expectKeywords: ["mathematics", "curriculum"],
    },
  },

  // ── 5. TRADES — Licensed Electrician (CA) ──
  {
    country: "CA",
    sector: "Trades",
    profession: "Licensed Electrician",
    resumeText: `JEAN-LUC BOUCHARD
Licensed Electrician (309A) | Toronto, ON, Canada
jl.bouchard@gmail.com | (416) 555-0293

CAREER SUMMARY
Red Seal certified electrician with 10+ years of experience in commercial, industrial, and residential electrical systems across Ontario.

EXPERIENCE

Lead Electrician — EllisDon Corporation, Toronto, ON (Apr 2019 – Present)
• Lead crew of 8 electricians on commercial construction projects valued at $15M–$50M
• Completed electrical installation for 32-storey mixed-use tower (400 units) on schedule
• Reduced material waste by 20% through improved conduit routing and pre-fabrication planning
• Ensured 100% compliance with Ontario Electrical Safety Code (OESC) across all projects
• Coordinated with general contractors, HVAC, and plumbing trades for integrated building systems

Journeyman Electrician — Aecon Group Inc., Toronto, ON (Jun 2015 – Mar 2019)
• Installed power distribution, lighting, and fire alarm systems for commercial properties
• Performed troubleshooting and maintenance on 600V industrial electrical systems
• Completed PLC and motor control installations for manufacturing facility upgrades
• Trained and supervised 4 apprentice electricians through their 309A programme

Apprentice Electrician — Miller Electrical Contractors Ltd, Mississauga, ON (Sep 2012 – May 2015)
• Completed 9,000-hour apprenticeship programme with IBEW Local 353
• Installed residential wiring, panel upgrades, and EV charging stations
• Assisted with solar panel installations on commercial rooftop systems (50kW+)

EDUCATION
Certificate of Qualification — 309A Construction and Maintenance Electrician, Ontario, 2015
Red Seal Interprovincial Certification, 2015
Electrical Techniques Diploma — George Brown College, Toronto, 2012

SKILLS
NEC/OESC Compliance, Commercial Wiring, Industrial 600V Systems, PLC Programming, Blueprint Reading, Conduit Bending, Fire Alarm Systems, EV Charging Installation, Solar PV Systems, Arc Flash Safety, LOTO Procedures, Crew Leadership`,
    jobDescriptionText: `Electrical Superintendent — PCL Construction (Toronto, ON)

About PCL:
PCL is one of Canada's largest general contracting organisations with operations across North America.

Role:
We are seeking an experienced Electrical Superintendent to manage electrical scope on a $200M healthcare facility construction project in the Greater Toronto Area.

Responsibilities:
• Oversee all electrical work including power distribution, emergency power, and low-voltage systems
• Manage electrical subcontractor crews (40+ electricians)
• Review electrical drawings and coordinate with engineers on RFIs and change orders
• Ensure compliance with OESC, CSA standards, and project safety requirements
• Develop and maintain electrical installation schedule aligned with project milestones
• Conduct quality inspections and commissioning activities

Requirements:
• Licensed 309A Electrician with Red Seal certification
• 10+ years of experience in commercial/institutional electrical construction
• Previous superintendent or foreman experience managing crews of 20+
• Expertise in power distribution, emergency generators, and life safety systems
• Strong knowledge of Ontario Electrical Safety Code and CSA standards
• Experience with healthcare or institutional facility construction preferred

Preferred:
• LEED AP or sustainability certification
• Experience with BIM/Revit coordination
• JHSC certification or equivalent safety training`,
    checks: {
      nameContains: "Jean-Luc",
      minExperience: 3,
      expectSkills: ["Blueprint Reading", "PLC"],
      expectKeywords: ["electrical", "safety"],
    },
  },

  // ── 6. MANUFACTURING — Production Manager (CA) ──
  {
    country: "CA",
    sector: "Manufacturing",
    profession: "Production Manager",
    resumeText: `AISHA PATEL
Production Manager | Hamilton, ON, Canada
aisha.patel@outlook.com | (905) 555-0176

PROFESSIONAL SUMMARY
Manufacturing professional with 8 years of experience in automotive and food production environments, specialising in lean manufacturing and continuous improvement.

EXPERIENCE

Production Manager — Maple Leaf Foods Inc., Hamilton, ON (Mar 2020 – Present)
• Manage 3 production lines with 95 unionised employees across 2 shifts producing 120 tonnes/day
• Implemented lean manufacturing programme reducing waste by $1.4M annually
• Achieved 99.2% OEE (Overall Equipment Effectiveness) on primary packaging line
• Led Six Sigma Green Belt project reducing product defects from 2.8% to 0.9%
• Maintained HACCP, SQF, and CFIA compliance with zero critical audit findings in 3 years

Production Supervisor — Linamar Corporation, Guelph, ON (Jun 2017 – Feb 2020)
• Supervised CNC machining and assembly operations for automotive powertrain components
• Managed team of 35 operators achieving 98.5% on-time delivery to OEM customers
• Reduced changeover time by 40% using SMED methodology
• Coordinated with quality team on PPAP submissions and customer quality audits

Manufacturing Associate — General Motors Oshawa Assembly Plant (Jan 2016 – May 2017)
• Operated and maintained robotic welding and assembly stations on truck body line
• Participated in Kaizen events contributing to 15% throughput improvement
• Completed GM-BIQ (Built-In Quality) Level 3 certification

EDUCATION
Bachelor of Engineering (Mechanical) — McMaster University, Hamilton, ON, 2015
Six Sigma Green Belt Certification — ASQ, 2021

SKILLS
Lean Manufacturing, Six Sigma, OEE, SMED, Kaizen, HACCP, SQF, GMP, CNC Operations, Production Scheduling, ERP Systems (SAP), Union Relations, 5S, Root Cause Analysis, Quality Management`,
    jobDescriptionText: `Plant Manager — Magna International (Brampton, ON)

About Magna:
Magna International is a leading global automotive supplier with 340+ manufacturing operations worldwide.

Role:
Seeking a Plant Manager to lead our Brampton stamping and assembly facility (250 employees, $80M revenue).

Responsibilities:
• Full P&L responsibility for plant operations
• Drive operational excellence through lean manufacturing and continuous improvement
• Ensure compliance with IATF 16949, ISO 14001, and customer quality standards
• Manage production scheduling to meet OEM delivery requirements (JIT/JIS)
• Lead workforce development including training, succession planning, and labour relations
• Oversee capital expenditure projects and equipment modernisation

Requirements:
• 8+ years of progressive manufacturing management experience
• Demonstrated expertise in lean manufacturing and Six Sigma (Green Belt minimum)
• Experience managing unionised workforce of 100+ employees
• Strong knowledge of automotive quality systems (IATF 16949, PPAP, APQP)
• Engineering degree or equivalent technical education
• ERP system proficiency (SAP preferred)

Preferred:
• Automotive stamping or assembly experience
• Black Belt certification
• Experience with Industry 4.0 / smart manufacturing initiatives`,
    checks: {
      nameContains: "Aisha",
      minExperience: 3,
      expectSkills: ["Lean Manufacturing", "Six Sigma"],
      expectKeywords: ["manufacturing", "quality"],
    },
  },

  // ── 7. FINANCE — Financial Analyst (US) ──
  {
    country: "US",
    sector: "Finance",
    profession: "Financial Analyst",
    resumeText: `DAVID CHEN
Senior Financial Analyst | New York, NY 10019
david.chen@gmail.com | (212) 555-0143

PROFESSIONAL SUMMARY
CFA charterholder and financial analyst with 7 years of experience in investment banking, equity research, and corporate finance.

EXPERIENCE

Senior Financial Analyst — Goldman Sachs, New York, NY (Aug 2021 – Present)
• Build and maintain DCF, LBO, and comparable company models for M&A transactions totalling $8B+
• Led financial due diligence for 3 healthcare sector acquisitions ranging from $200M–$1.5B
• Prepare pitch books and investment memoranda for Managing Director client presentations
• Developed automated financial screening tool in Python reducing deal sourcing time by 60%

Financial Analyst — J.P. Morgan Chase, New York, NY (Jun 2019 – Jul 2021)
• Performed equity valuation analysis for Technology, Media, and Telecom (TMT) sector coverage
• Created quarterly earnings models and sensitivity analyses for 15 coverage companies
• Published 25+ equity research notes contributing to team's #2 Institutional Investor ranking
• Supported $3.2B IPO process including S-1 drafting and investor roadshow materials

Junior Analyst — Deloitte Advisory, New York, NY (Sep 2017 – May 2019)
• Conducted financial analysis and benchmarking for Fortune 500 corporate clients
• Built three-statement financial models and variance analysis reports
• Assisted with SOX compliance testing and internal control assessments

EDUCATION
Master of Business Administration (MBA) — Columbia Business School, 2021
Bachelor of Science in Finance — New York University, Stern School of Business, 2017

CERTIFICATIONS
CFA Charterholder (CFA Institute)
Series 7 and Series 63 Licenses (FINRA)
Bloomberg Market Concepts (BMC)

SKILLS
Financial Modelling, DCF Valuation, LBO Analysis, M&A Advisory, Equity Research, Pitch Books, Python, Excel/VBA, Bloomberg Terminal, FactSet, Capital IQ, SOX Compliance, SEC Filings, GAAP`,
    jobDescriptionText: `Vice President, Investment Banking — Morgan Stanley (New York, NY)

About Morgan Stanley:
Morgan Stanley is a leading global financial services firm providing investment banking, securities, wealth management, and investment management services.

Role:
Seeking a VP-level Investment Banker to join our Healthcare M&A advisory practice.

Responsibilities:
• Lead deal execution for M&A and capital markets transactions in the healthcare sector
• Manage and mentor teams of analysts and associates
• Develop client relationships and contribute to new business origination
• Build complex financial models including DCF, LBO, merger models, and accretion/dilution analyses
• Prepare board presentations, fairness opinions, and regulatory filings
• Coordinate with legal, compliance, and accounting teams on transaction structuring

Requirements:
• 5+ years of investment banking or related financial advisory experience
• Strong financial modelling skills (DCF, LBO, comparable companies, precedent transactions)
• Healthcare sector expertise preferred
• MBA from top-tier business school
• CFA designation or progress toward CFA preferred
• Proficiency in Excel, PowerPoint, Bloomberg, Capital IQ
• Series 7 and 63 licenses required

Preferred:
• Experience with cross-border M&A transactions
• Python or VBA automation skills
• Existing relationships with healthcare C-suite executives`,
    checks: {
      nameContains: "David",
      minExperience: 3,
      expectSkills: ["Financial Modelling", "Python"],
      expectKeywords: ["M&A", "valuation"],
    },
  },

  // ── 8. LEGAL — Solicitor (UK) ──
  {
    country: "UK",
    sector: "Legal",
    profession: "Solicitor",
    resumeText: `OLIVIA HARTLEY LLB
Commercial Solicitor | Manchester, United Kingdom
olivia.hartley@cliffordchance.com | 07789 654321

PROFESSIONAL SUMMARY
SRA-qualified solicitor with 6 years PQE specialising in commercial contracts, M&A, and corporate advisory within Magic Circle and Top 50 firms.

EXPERIENCE

Senior Associate — Clifford Chance LLP, Manchester (Sep 2021 – Present)
• Advise FTSE 250 clients on commercial agreements including SaaS, licensing, and distribution
• Led legal workstream on £400M private equity acquisition of UK healthcare group
• Managed team of 4 associates and 2 trainees on cross-border M&A transactions
• Drafted and negotiated share purchase agreements, warranties, and disclosure letters
• Developed standardised contract templates reducing client turnaround time by 35%

Associate Solicitor — DLA Piper UK LLP, Manchester (Sep 2019 – Aug 2021)
• Acted on commercial real estate transactions ranging from £5M–£50M
• Drafted heads of terms, lease agreements, and due diligence reports
• Advised SME clients on GDPR compliance and data processing agreements
• Supported team on 12 M&A completions generating £2.8M in firm revenue

Trainee Solicitor — Eversheds Sutherland LLP, Leeds (Sep 2017 – Aug 2019)
• Completed 4 training seats: Corporate, Commercial, Real Estate, Employment
• Assisted partners on employment tribunal claims and settlement agreements
• Drafted board minutes, shareholder resolutions, and company secretarial documents

EDUCATION
Legal Practice Course (LPC) — BPP University, Manchester, 2017 (Distinction)
Bachelor of Laws (LLB Hons) — University of Manchester, 2016 (First Class)

SKILLS
Commercial Contracts, M&A, Corporate Advisory, Share Purchase Agreements, Due Diligence, GDPR Compliance, Real Estate Transactions, Contract Negotiation, Client Management, Legal Research, Practical Law, LexisNexis`,
    jobDescriptionText: `Partner Track — Senior Associate, Corporate/M&A — Linklaters LLP (London, UK)

About Linklaters:
Linklaters is a leading global law firm with expertise in the world's most challenging and important deals and disputes.

Role:
We are seeking a Senior Associate to join our Corporate/M&A practice in London.

Responsibilities:
• Lead on mid-market and large-cap M&A transactions (£100M+)
• Manage transaction execution from heads of terms to completion
• Draft and negotiate SPAs, disclosure letters, and ancillary documents
• Supervise and develop junior associates and trainees
• Contribute to business development and client relationship management
• Advise on corporate governance, public company obligations, and regulatory matters

Requirements:
• Qualified solicitor (England & Wales) with 5-8 years PQE
• Strong M&A and corporate advisory experience from a Top 20 UK firm
• Experience managing teams and complex multi-party transactions
• Excellent drafting and negotiation skills
• Commercial awareness and strong client-facing skills
• Upper Second Class degree or above from a Russell Group university

Preferred:
• Private equity or public M&A experience
• Cross-border transaction experience
• Sector expertise in healthcare, technology, or financial services`,
    checks: {
      nameContains: "Olivia",
      minExperience: 3,
      expectSkills: ["M&A", "Due Diligence"],
      expectKeywords: ["solicitor", "corporate"],
    },
  },

  // ── 9. HR — HR Business Partner (US) ──
  {
    country: "US",
    sector: "Human Resources",
    profession: "HR Business Partner",
    resumeText: `JENNIFER MARTINEZ PHR
HR Business Partner | Austin, TX 78701
jennifer.martinez@gmail.com | (512) 555-0198

PROFESSIONAL SUMMARY
SHRM-CP and PHR certified HR professional with 8 years of experience in talent management, employee relations, and organisational development across technology and healthcare sectors.

EXPERIENCE

Senior HR Business Partner — Dell Technologies, Austin, TX (Jan 2021 – Present)
• Partner with Engineering and Product leadership supporting 800+ employees across 3 business units
• Reduced voluntary turnover from 22% to 14% through targeted retention programme and stay interviews
• Led workforce planning and headcount modelling for annual $45M people budget
• Designed and launched manager effectiveness programme with 92% satisfaction rating
• Managed 45+ employee relations cases annually including investigations and performance management

HR Business Partner — Ascension Health, Austin, TX (Mar 2018 – Dec 2020)
• Supported 500+ clinical and administrative staff across 2 hospital locations
• Implemented new HRIS (Workday) reducing manual HR processes by 60%
• Facilitated organisational restructuring affecting 3 departments with zero grievances filed
• Conducted compensation benchmarking resulting in $2.1M market adjustment programme
• Achieved 95% annual performance review completion rate (up from 72%)

HR Generalist — Indeed.com, Austin, TX (Jun 2016 – Feb 2018)
• Managed full-cycle recruiting for engineering roles (40+ hires annually)
• Administered benefits enrollment, FMLA, and ADA accommodation requests
• Coordinated quarterly engagement surveys and action planning with leadership

EDUCATION
Master of Science in Human Resource Management — Texas A&M University, 2016
Bachelor of Arts in Psychology — University of Texas at Austin, 2014

CERTIFICATIONS
SHRM-CP (SHRM Certified Professional)
PHR (Professional in Human Resources — HRCI)
Certified DiSC Facilitator

SKILLS
Employee Relations, Talent Management, Workforce Planning, Compensation & Benefits, HRIS (Workday, SAP SuccessFactors), Performance Management, Organisational Development, Recruiting, Employment Law, FMLA/ADA, DEI Programmes, Change Management`,
    jobDescriptionText: `Director of People Operations — Stripe (Austin, TX)

About Stripe:
Stripe is a financial infrastructure platform for businesses. Millions of companies use Stripe to accept payments, grow revenue, and accelerate new business opportunities.

Role:
We're looking for a Director of People Operations to lead HR strategy for our Austin engineering hub (400+ employees).

Responsibilities:
• Develop and execute people strategy aligned with business objectives
• Lead a team of 5 HRBPs and 3 People Operations specialists
• Drive talent acquisition, retention, and succession planning initiatives
• Partner with leadership on organizational design and change management
• Oversee employee relations, performance management, and compensation programmes
• Champion DEI initiatives and inclusive workplace culture
• Manage annual people budget and headcount planning

Requirements:
• 8+ years of progressive HR experience, including 3+ years as HRBP or HR Manager
• Experience supporting technology or engineering organisations
• Strong knowledge of employment law and HR compliance
• Experience with HRIS platforms (Workday preferred)
• SHRM-CP/SCP or PHR/SPHR certification
• Demonstrated ability to influence and partner with senior leadership
• Master's degree in HR, Organizational Development, or related field preferred

Preferred:
• Experience in high-growth technology companies
• Expertise in compensation and equity programme design
• Experience with international HR operations`,
    checks: {
      nameContains: "Jennifer",
      minExperience: 3,
      expectSkills: ["Employee Relations", "Workforce Planning"],
      expectKeywords: ["talent", "performance"],
    },
  },

  // ── 10. ACCOUNTING — Chartered Accountant (UK) ──
  {
    country: "UK",
    sector: "Accounting",
    profession: "Chartered Accountant",
    resumeText: `THOMAS WRIGHT ACA
Chartered Accountant | Birmingham, United Kingdom
thomas.wright@pwc.com | 07567 890123

PROFESSIONAL SUMMARY
ACA-qualified chartered accountant with 7 years of experience in audit, financial reporting, and advisory services within Big Four and mid-tier practices.

EXPERIENCE

Audit Manager — PricewaterhouseCoopers (PwC) LLP, Birmingham (Oct 2021 – Present)
• Manage portfolio of 12 audit clients across manufacturing, retail, and technology sectors
• Lead audit teams of 4-8 staff on engagements with fees ranging from £150K–£800K
• Identified material misstatement of £3.2M in revenue recognition for FTSE SmallCap client
• Achieved 100% on-time delivery of audit opinions for 2023 and 2024 reporting seasons
• Developed sector-specific audit approach for SaaS companies reducing hours by 25%

Senior Auditor — KPMG LLP, Birmingham (Sep 2019 – Sep 2021)
• Executed statutory audits under UK GAAP and IFRS for clients with turnover up to £500M
• Performed substantive testing on revenue, receivables, and inventory balances
• Prepared audit completion memoranda and presented findings to Audit Committees
• Mentored and supervised 3 junior auditors through their ACA training

Trainee Auditor — BDO LLP, London (Sep 2017 – Aug 2019)
• Completed ACA training contract with rotations across audit, tax, and advisory
• Assisted with year-end financial statement preparation for owner-managed businesses
• Performed controls testing for SOX-compliant US-listed subsidiaries

EDUCATION
ACA Qualification — ICAEW (Institute of Chartered Accountants in England and Wales), 2019
Bachelor of Science (Accounting & Finance) — University of Birmingham, 2017 (First Class)

SKILLS
Statutory Audit, IFRS, UK GAAP, FRS 102, Revenue Recognition, Financial Reporting, Risk Assessment, Internal Controls, SOX Compliance, Audit Planning, CaseWare, CCH, Excel/VBA, Client Relationship Management, Team Leadership`,
    jobDescriptionText: `Audit Director — Deloitte LLP (Birmingham, UK)

About Deloitte:
Deloitte is one of the world's largest professional services networks providing audit, assurance, consulting, and financial advisory services.

Role:
We are seeking an Audit Director to lead our Manufacturing & Industrial Products audit practice in the Midlands.

Responsibilities:
• Lead and manage a portfolio of audit engagements with combined fees of £3M+
• Build and maintain client relationships at CFO and Audit Committee level
• Drive quality and compliance with ISA (UK) and FRC requirements
• Mentor and develop a team of managers and senior auditors
• Contribute to business development and proposal writing
• Advise clients on complex accounting issues under IFRS and UK GAAP

Requirements:
• ACA, ACCA, or equivalent qualification
• Minimum 6 years post-qualification audit experience in a Top 10 firm
• Strong knowledge of IFRS, UK GAAP (FRS 102), and ISA (UK) standards
• Experience managing client portfolios and leading audit teams
• Manufacturing or industrial sector experience preferred
• Business development and proposal experience
• Strong commercial acumen and client-facing skills

Preferred:
• Experience with FTSE-listed or AIM-listed company audits
• Knowledge of ESG reporting and sustainability assurance
• International audit experience (US GAAP/PCAOB)`,
    checks: {
      nameContains: "Thomas",
      minExperience: 3,
      expectSkills: ["IFRS", "Audit"],
      expectKeywords: ["audit", "financial"],
    },
  },

  // ── 11. CREATIVE — UX Designer (NZ) ──
  {
    country: "NZ",
    sector: "Creative/Design",
    profession: "UX Designer",
    resumeText: `MAIA THOMPSON
Senior UX Designer | Wellington, New Zealand
maia.thompson@xtra.co.nz | 022 345 678

CAREER SUMMARY
Human-centred designer with 6 years of experience crafting digital products for government, fintech, and SaaS platforms in New Zealand and Australia.

EXPERIENCE

Senior UX Designer — Xero Limited, Wellington (Feb 2022 – Present)
• Lead design for Xero's invoicing and payments experience used by 3.5M+ subscribers globally
• Conducted 40+ usability studies and A/B tests increasing invoice payment rate by 22%
• Established component library and design tokens in Figma reducing design handoff time by 45%
• Collaborated with 3 product squads using dual-track agile methodology
• Mentored 2 junior designers through Xero's design career framework

UX Designer — Department of Internal Affairs (DIA), Wellington (Mar 2020 – Jan 2022)
• Designed accessible digital services aligned with NZ Government Web Standards and WCAG 2.1 AA
• Led user research for RealMe identity verification redesign serving 4M+ New Zealanders
• Created service blueprints and journey maps for SmartStart life events platform
• Facilitated co-design workshops with Maori and Pasifika communities ensuring cultural responsiveness

Junior UX Designer — Trade Me Group Ltd, Wellington (Jun 2018 – Feb 2020)
• Designed search and browse experiences for NZ's largest online marketplace
• Produced wireframes, prototypes, and user flows in Sketch and InVision
• Conducted guerrilla usability testing at Trade Me offices and public venues

EDUCATION
Bachelor of Design (Hons) — Victoria University of Wellington, 2018
Major: Interaction Design

SKILLS
User Research, Usability Testing, Figma, Sketch, Prototyping, Design Systems, Wireframing, A/B Testing, Service Design, Journey Mapping, WCAG Accessibility, Agile/Scrum, Design Thinking, HTML/CSS Basics`,
    jobDescriptionText: `Lead Product Designer — Sharesies (Wellington, New Zealand)

About Sharesies:
Sharesies is a New Zealand fintech company making investing accessible to everyone. We serve 600,000+ investors across NZ and Australia.

Role:
We're looking for a Lead Product Designer to own the end-to-end design of our investing experience.

Responsibilities:
• Define design vision and strategy for core investing product
• Lead a team of 3 product designers and 1 researcher
• Conduct and oversee user research to inform product decisions
• Build and maintain our design system and component library
• Collaborate with product managers and engineers in cross-functional squads
• Champion accessibility and inclusive design practices
• Present design work to leadership and stakeholders

Requirements:
• 5+ years of product/UX design experience
• Portfolio demonstrating end-to-end product design process
• Proficiency in Figma and modern design tools
• Experience with design systems at scale
• Strong user research and usability testing skills
• Experience in fintech, SaaS, or marketplace products
• Based in or willing to relocate to Wellington, NZ

Preferred:
• Experience designing for financial products or regulated industries
• Understanding of NZ accessibility standards (WCAG 2.1)
• Experience with Te Ao Maori design principles`,
    checks: {
      nameContains: "Maia",
      minExperience: 3,
      expectSkills: ["Figma", "User Research"],
      expectKeywords: ["design", "accessibility"],
    },
  },

  // ── 12. SALES — Account Executive (US) ──
  {
    country: "US",
    sector: "Sales",
    profession: "Account Executive",
    resumeText: `BRANDON TAYLOR
Senior Account Executive | San Francisco, CA 94103
brandon.taylor@salesforce.com | (415) 555-0267

PROFESSIONAL SUMMARY
Top-performing SaaS sales professional with 7 years of experience closing enterprise deals and building strategic accounts in the technology sector.

EXPERIENCE

Senior Account Executive — Salesforce, San Francisco, CA (Jan 2021 – Present)
• Manage portfolio of 35 enterprise accounts generating $4.2M annual recurring revenue
• Achieved 142% of annual quota ($5.8M) in FY2024, earning President's Club recognition
• Closed largest new logo deal in team history ($1.8M ACV, Fortune 500 financial services client)
• Built and managed pipeline of $15M+ through outbound prospecting and partner referrals
• Mentored 3 BDRs on discovery, objection handling, and demo techniques

Account Executive — HubSpot, San Francisco, CA (Mar 2019 – Dec 2020)
• Sold Marketing Hub and Sales Hub to mid-market companies ($50K–$200K ACV)
• Exceeded quota in 7 of 8 quarters, averaging 118% attainment
• Maintained 45-day average sales cycle through consultative selling approach
• Generated $2.1M in new business revenue in FY2020

Sales Development Representative — Twilio, San Francisco, CA (Jun 2017 – Feb 2019)
• Prospected and qualified 60+ outbound accounts monthly via cold calling and email sequences
• Set average 25 qualified meetings per month, exceeding target by 30%
• Promoted to Account Executive track after 18 months

EDUCATION
Bachelor of Business Administration — University of California, Berkeley, 2017

SKILLS
Enterprise Sales, SaaS, Consultative Selling, Pipeline Management, Salesforce CRM, MEDDIC, SPIN Selling, Contract Negotiation, Account Planning, Forecasting, Demo/Presentation Skills, Partner Channel Sales`,
    jobDescriptionText: `Regional Vice President, Enterprise Sales — Datadog (San Francisco, CA)

About Datadog:
Datadog is a monitoring and analytics platform for cloud-scale applications, serving 26,800+ customers globally.

Role:
We're seeking a Regional VP to lead a team of 8 Enterprise Account Executives covering West Coast accounts.

Responsibilities:
• Lead and develop a team of enterprise AEs driving $30M+ in annual bookings
• Build and execute territory plans for strategic enterprise accounts
• Forecast accurately and manage pipeline to meet quarterly and annual targets
• Recruit, hire, and onboard top sales talent
• Partner with Solutions Engineering, Customer Success, and Marketing teams
• Develop relationships with C-level and VP-level technology leaders

Requirements:
• 7+ years of B2B SaaS sales experience with 3+ years in enterprise sales
• Track record of consistently exceeding quota (120%+ attainment)
• Experience managing complex sales cycles ($500K+ ACV)
• Strong knowledge of MEDDIC or similar enterprise sales methodology
• Experience with Salesforce CRM and sales analytics tools
• Bachelor's degree required; MBA preferred

Preferred:
• Experience selling infrastructure, DevOps, or monitoring solutions
• Previous people management or team lead experience
• Existing relationships with Fortune 500 technology decision-makers`,
    checks: {
      nameContains: "Brandon",
      minExperience: 3,
      expectSkills: ["Salesforce CRM", "Pipeline Management"],
      expectKeywords: ["sales", "enterprise"],
    },
  },

  // ── 13. LOGISTICS — Supply Chain Manager (AU) ──
  {
    country: "AU",
    sector: "Transportation/Logistics",
    profession: "Supply Chain Manager",
    resumeText: `RACHEL KIM
Supply Chain Manager | Sydney, NSW 2000
rachel.kim@woolworths.com.au | 0434 567 890

CAREER SUMMARY
Supply chain professional with 8 years of experience in FMCG and retail logistics across Australia, specialising in demand planning, warehouse operations, and distribution network optimisation.

EXPERIENCE

Supply Chain Manager — Woolworths Group Ltd, Sydney, NSW (Apr 2021 – Present)
• Manage end-to-end supply chain for Fresh produce category across NSW ($800M annual volume)
• Reduced supply chain costs by $4.2M through route optimisation and carrier consolidation
• Improved on-shelf availability from 94.5% to 97.8% through enhanced demand forecasting models
• Led implementation of SAP IBP for demand planning across 3 distribution centres
• Managed relationships with 120+ suppliers and 8 3PL partners

Senior Supply Chain Analyst — Coles Group Ltd, Melbourne, VIC (Jun 2018 – Mar 2021)
• Developed demand forecasting models reducing forecast error (MAPE) from 35% to 22%
• Coordinated seasonal and promotional supply plans for 800+ SKUs
• Built Power BI dashboards tracking KPIs including OTIF, fill rate, and inventory turns
• Supported $15M warehouse automation project from business case through go-live

Logistics Coordinator — DHL Supply Chain, Sydney, NSW (Jan 2016 – May 2018)
• Coordinated inbound and outbound logistics for 3PL warehouse (50,000 sqm)
• Managed transport scheduling for 200+ daily truck movements
• Achieved 99.1% order accuracy rate through improved picking and packing processes

EDUCATION
Master of Supply Chain Management — University of Sydney, 2018
Bachelor of Commerce — University of New South Wales, 2015

SKILLS
Demand Planning, Supply Chain Optimisation, SAP IBP, SAP ERP, Warehouse Management, 3PL Management, Power BI, Inventory Management, OTIF, S&OP, Procurement, Vendor Management, Route Optimisation, FMCG Logistics`,
    jobDescriptionText: `Head of Supply Chain — Amazon Australia (Sydney, NSW)

About Amazon:
Amazon is a global e-commerce and technology leader. Amazon Australia operates multiple fulfilment centres and last-mile delivery stations across the country.

Responsibilities:
• Lead supply chain strategy for Amazon Australia's grocery and FMCG categories
• Oversee demand planning, inventory management, and fulfilment operations
• Manage team of 15 supply chain professionals across planning and operations
• Drive cost reduction through network optimisation and automation initiatives
• Partner with global supply chain teams on best practice implementation
• Ensure compliance with Australian food safety and logistics regulations

Requirements:
• 8+ years of progressive supply chain management experience
• Strong background in FMCG, grocery, or retail supply chain
• Expertise in demand planning and S&OP processes
• Experience with SAP, Oracle, or similar ERP systems
• Demonstrated ability to drive cost savings at scale ($1M+)
• Master's degree in Supply Chain, Logistics, or related field preferred

Preferred:
• Experience with e-commerce or omni-channel fulfilment
• Knowledge of Australian food safety standards
• Experience with warehouse automation and robotics
• Lean/Six Sigma certification`,
    checks: {
      nameContains: "Rachel",
      minExperience: 3,
      expectSkills: ["Demand Planning", "SAP"],
      expectKeywords: ["supply chain", "inventory"],
    },
  },

  // ── 14. GOVERNMENT — Policy Analyst (NZ) ──
  {
    country: "NZ",
    sector: "Government/Public Service",
    profession: "Policy Analyst",
    resumeText: `HEMI WATENE
Senior Policy Analyst | Wellington, New Zealand
hemi.watene@msd.govt.nz | 021 987 654

CAREER SUMMARY
Public sector policy professional with 7 years of experience in social policy development, Cabinet paper drafting, and evidence-based policy analysis across New Zealand government agencies.

EXPERIENCE

Senior Policy Analyst — Ministry of Social Development (MSD), Wellington (Mar 2021 – Present)
• Lead policy development on housing and homelessness initiatives serving 50,000+ New Zealanders
• Authored 8 Cabinet papers and regulatory impact statements approved by Cabinet Social Wellbeing Committee
• Managed $12M policy budget and reporting to Minister's office
• Led cross-agency working group with MHU, MBIE, and Te Puni Kokiri on Maori housing strategy
• Conducted quantitative analysis of benefit system outcomes using IDI (Integrated Data Infrastructure)

Policy Analyst — Ministry of Education, Wellington (Jun 2019 – Feb 2021)
• Developed policy options for school property investment programme ($1.2B over 10 years)
• Prepared briefings and oral advice for Minister and Associate Ministers
• Engaged with school boards and education sector stakeholders through formal consultation processes
• Contributed to Tomorrow's Schools reform programme policy implementation

Graduate Policy Analyst — Department of the Prime Minister and Cabinet (DPMC), Wellington (Jan 2018 – May 2019)
• Supported National Security Committee and Officials' Committee on Domestic and External Security
• Drafted situation reports and policy briefings for senior officials
• Coordinated interagency responses to civil defence emergencies

EDUCATION
Master of Public Policy — Victoria University of Wellington, 2017
Bachelor of Arts (Political Science & Te Reo Maori) — University of Auckland, 2015

SKILLS
Policy Analysis, Cabinet Paper Drafting, Regulatory Impact Statements, Ministerial Briefings, Stakeholder Engagement, Evidence-Based Policy, Quantitative Analysis, IDI/Stats NZ, Te Tiriti o Waitangi, Cross-Agency Coordination, Budget Analysis, Public Consultation, Te Reo Maori (Conversational)`,
    jobDescriptionText: `Principal Advisor — Te Tari Taiwhenua / Department of Internal Affairs (Wellington, NZ)

About DIA:
Te Tari Taiwhenua supports the machinery of government and serves communities throughout Aotearoa New Zealand.

Role:
We seek a Principal Advisor to lead policy development in our Local Government and Community branch.

Responsibilities:
• Provide strategic policy advice to the Minister of Local Government
• Lead complex policy projects from scoping through to Cabinet decision
• Build and maintain relationships with local government sector, iwi, and community organisations
• Apply Te Tiriti o Waitangi principles and He Whakaputanga commitments in policy advice
• Manage and mentor a team of 3-4 policy analysts
• Represent DIA at interagency forums and Select Committee appearances

Requirements:
• 7+ years of policy experience in the New Zealand public sector
• Demonstrated experience drafting Cabinet papers and regulatory impact statements
• Strong analytical skills including quantitative and qualitative methods
• Understanding of Te Tiriti o Waitangi and its application in policy
• Experience in stakeholder engagement and public consultation
• Master's degree in Public Policy, Political Science, or related field

Preferred:
• Experience in local government or community development policy
• Te Reo Maori proficiency
• Experience with the Integrated Data Infrastructure (IDI)
• Knowledge of the Resource Management Act and Local Government Act`,
    checks: {
      nameContains: "Hemi",
      minExperience: 3,
      expectSkills: ["Policy Analysis", "Stakeholder Engagement"],
      expectKeywords: ["policy", "Cabinet"],
    },
  },

  // ── 15. CUSTOMER SERVICE — Customer Success Manager (UK) ──
  {
    country: "UK",
    sector: "Customer Service",
    profession: "Customer Success Manager",
    resumeText: `SOPHIE CHEN
Senior Customer Success Manager | London, United Kingdom
sophie.chen@zendesk.com | 07456 789012

PROFESSIONAL SUMMARY
Customer success professional with 6 years of experience managing enterprise accounts, reducing churn, and driving product adoption in B2B SaaS environments.

EXPERIENCE

Senior Customer Success Manager — Zendesk UK Ltd, London (Mar 2022 – Present)
• Manage portfolio of 45 enterprise accounts totalling £6.5M ARR across EMEA
• Achieved 96% gross retention rate and 118% net revenue retention through upsell and expansion
• Reduced time-to-value from 45 days to 18 days by redesigning customer onboarding programme
• Led quarterly business reviews with C-level stakeholders driving product adoption and ROI
• Developed customer health scoring model now used across EMEA CSM team

Customer Success Manager — Intercom, London (Jun 2020 – Feb 2022)
• Managed 60+ mid-market accounts with combined ARR of £3.2M
• Achieved 92% renewal rate, 15% above team average
• Created self-service knowledge base reducing support ticket volume by 30%
• Identified and escalated at-risk accounts, saving £450K in potential churn

Account Manager — HubSpot, Dublin (Aug 2018 – May 2020)
• Managed inbound customer enquiries and product demonstrations for EMEA prospects
• Supported onboarding of 200+ new customers onto Marketing Hub platform
• Achieved quarterly upsell target 8 consecutive quarters

EDUCATION
Bachelor of Business Studies — University of Leeds, 2018

SKILLS
Customer Success, Account Management, SaaS, ARR/NRR Metrics, Customer Onboarding, Churn Reduction, Salesforce, Gainsight, Health Scoring, QBR Presentations, Stakeholder Management, Product Adoption, Renewal Management, Cross-selling`,
    jobDescriptionText: `Head of Customer Success, EMEA — Notion (London, UK)

About Notion:
Notion is the all-in-one workspace for notes, docs, wikis, and project management, used by millions of teams worldwide.

Role:
We are hiring a Head of Customer Success to build and scale our EMEA CS function.

Responsibilities:
• Build and lead a team of 8-10 CSMs covering enterprise and mid-market accounts
• Define and execute customer success strategy for EMEA region
• Drive net revenue retention targets (120%+ NRR)
• Develop customer health scoring framework and early warning systems
• Partner with Sales, Product, and Support on customer lifecycle optimisation
• Establish QBR cadence and executive engagement programmes

Requirements:
• 5+ years in customer success or account management in B2B SaaS
• Proven track record of driving retention and expansion revenue
• Experience managing and mentoring CS teams
• Strong knowledge of CS platforms (Gainsight, Vitally, or similar)
• Analytical mindset with experience building health scores and dashboards
• Excellent presentation and communication skills

Preferred:
• Experience in productivity, collaboration, or knowledge management tools
• Multi-language capability (European languages)
• Startup or scale-up experience`,
    checks: {
      nameContains: "Sophie",
      minExperience: 3,
      expectSkills: ["Customer Success", "Salesforce"],
      expectKeywords: ["retention", "SaaS"],
    },
  },

  // ── 16. SOCIAL WORK — Social Worker (CA) ──
  {
    country: "CA",
    sector: "Social Work",
    profession: "Social Worker",
    resumeText: `MARIE-CLAIRE DUBOIS RSW
Registered Social Worker | Vancouver, BC, Canada
mc.dubois@gmail.com | (604) 555-0134

PROFESSIONAL SUMMARY
Registered Social Worker (BC College of Social Workers) with 8 years of experience in child welfare, mental health, and community support services.

EXPERIENCE

Clinical Social Worker — BC Children's Hospital, Vancouver, BC (Apr 2020 – Present)
• Provide psychosocial assessments and therapeutic interventions for 80+ paediatric patients monthly
• Specialise in trauma-informed care for children affected by abuse and family violence
• Facilitate weekly CBT and DBT skills groups for adolescent mental health inpatients
• Coordinate discharge planning with community services, schools, and family support agencies
• Supervised 4 MSW practicum students through their clinical placement

Child Protection Social Worker — Ministry of Children and Family Development (MCFD), Vancouver (Jun 2017 – Mar 2020)
• Managed caseload of 25+ families under investigation for child protection concerns
• Conducted risk assessments using Structured Decision Making (SDM) tools
• Collaborated with RCMP, schools, and Indigenous community agencies on complex files
• Facilitated family conferences and developed safety plans for at-risk children
• Testified as expert witness in BC Provincial Court (Family Division) on 8 occasions

Community Support Worker — Elizabeth Fry Society of Greater Vancouver (Sep 2016 – May 2017)
• Provided case management and advocacy for women transitioning from incarceration
• Connected clients with housing, employment, and addiction recovery services
• Facilitated psychoeducational groups on healthy relationships and parenting skills

EDUCATION
Master of Social Work (MSW) — University of British Columbia, 2016
Bachelor of Arts (Psychology) — Simon Fraser University, 2014

CERTIFICATIONS
Registered Social Worker (RSW) — BC College of Social Workers
Applied Suicide Intervention Skills Training (ASIST)
Trauma-Focused CBT Certificate

SKILLS
Clinical Assessment, Trauma-Informed Care, CBT, DBT, Child Protection, Risk Assessment, Case Management, Crisis Intervention, Group Facilitation, Discharge Planning, Court Testimony, Cultural Safety, Indigenous Awareness`,
    jobDescriptionText: `Team Leader, Child and Youth Mental Health — Fraser Health Authority (Surrey, BC)

About Fraser Health:
Fraser Health is the largest health authority in British Columbia, serving 1.9 million people.

Role:
We are seeking a Team Leader to oversee our Child and Youth Mental Health (CYMH) team in Surrey.

Responsibilities:
• Lead a multidisciplinary team of 8 clinicians (social workers, psychologists, counsellors)
• Provide clinical supervision and case consultation
• Manage waitlist and intake processes for CYMH services
• Ensure compliance with MCFD and health authority clinical standards
• Develop and implement evidence-based treatment programmes
• Build partnerships with schools, community agencies, and Indigenous services

Requirements:
• Master of Social Work or equivalent clinical degree
• Current RSW registration with BC College of Social Workers
• 5+ years of clinical experience in child and youth mental health
• Experience with trauma-informed practice and evidence-based therapies (CBT, DBT)
• Previous leadership or supervisory experience
• Knowledge of BC Mental Health Act and child welfare legislation

Preferred:
• Experience working with Indigenous communities and cultural safety training
• Applied Suicide Intervention Skills Training (ASIST)
• Experience with Structured Decision Making (SDM) or similar assessment tools`,
    checks: {
      nameContains: "Marie-Claire",
      minExperience: 3,
      expectSkills: ["CBT", "Crisis Intervention"],
      expectKeywords: ["mental health", "clinical"],
    },
  },

  // ── 17. REAL ESTATE — Real Estate Agent (AU) ──
  {
    country: "AU",
    sector: "Real Estate",
    profession: "Real Estate Agent",
    resumeText: `JACK MORRISON
Licensed Real Estate Agent | Sydney, NSW 2000
jack.morrison@raywhite.com | 0421 234 567

CAREER SUMMARY
Licensed real estate agent with 6 years of experience in residential sales and property management across Sydney's Eastern Suburbs and Inner West markets.

EXPERIENCE

Senior Sales Agent — Ray White Double Bay, Sydney, NSW (Mar 2021 – Present)
• Achieved $85M in residential property sales across 62 transactions in FY2024
• Ranked #3 agent in Ray White NSW network by GCI (Gross Commission Income)
• Specialise in prestige market ($3M–$15M) across Bellevue Hill, Point Piper, and Rose Bay
• Built database of 2,500+ qualified buyers through digital marketing and open home strategies
• Negotiated record-breaking $12.5M sale in Vaucluse, 18% above vendor reserve

Sales Agent — McGrath Estate Agents, Sydney, NSW (Jun 2019 – Feb 2021)
• Sold 38 residential properties with average sale price of $1.6M
• Achieved 95% auction clearance rate across 28 auction campaigns
• Generated 60% of new listings through referrals and door-knocking campaigns
• Managed vendor relationships from appraisal through to settlement

Sales Associate — LJ Hooker Newtown, Sydney, NSW (Jan 2018 – May 2019)
• Assisted senior agents with open homes, buyer enquiries, and contract preparation
• Conducted 200+ open home inspections and buyer follow-ups weekly
• Completed Certificate of Registration under Fair Trading NSW

EDUCATION
Diploma of Property Services — TAFE NSW, 2020
Bachelor of Business — Western Sydney University, 2017

CERTIFICATIONS
Licensed Real Estate Agent — NSW Fair Trading
REINSW Accredited Auctioneer
CPD Compliance (12 points annually)

SKILLS
Residential Sales, Auction Campaigns, Property Appraisal, Vendor Management, Buyer Database, Digital Marketing, Contract Negotiation, CRM (Rex, VaultRE), Market Analysis, Open Home Strategy, Prestige Property, REA/Domain Listings`,
    jobDescriptionText: `Sales Director — CBRE Residential (Sydney, NSW)

About CBRE:
CBRE is the world's largest commercial real estate services and investment firm.

Role:
CBRE Residential Projects is seeking a Sales Director to lead off-the-plan apartment sales for a $500M development in Sydney's Inner West.

Responsibilities:
• Lead sales strategy for 450-unit residential development across 3 stages
• Manage team of 6 sales agents and coordinate with developer marketing team
• Develop and maintain qualified buyer database for domestic and international purchasers
• Conduct weekly sales reporting and pipeline analysis for developer stakeholders
• Oversee display suite operations, open homes, and private inspections
• Negotiate contracts and manage exchange through to settlement

Requirements:
• Licensed Real Estate Agent (NSW)
• 5+ years of residential sales experience with demonstrated high performance
• Experience in project marketing or off-the-plan sales preferred
• Strong negotiation and vendor/developer relationship skills
• Proficiency in CRM systems and digital marketing platforms
• Knowledge of NSW property legislation and contract law

Preferred:
• Experience with prestige or high-value property sales ($3M+)
• Multi-language capability (Mandarin, Cantonese, or Korean preferred)
• REINSW membership and accredited auctioneer designation`,
    checks: {
      nameContains: "Jack",
      minExperience: 3,
      expectSkills: ["Contract Negotiation", "Market Analysis"],
      expectKeywords: ["sales", "property"],
    },
  },

  // ── 18. CONSTRUCTION — Construction Superintendent (US) ──
  {
    country: "US",
    sector: "Construction Management",
    profession: "Construction Superintendent",
    resumeText: `ROBERT "BOBBY" GARCIA
Construction Superintendent | Houston, TX 77002
bobby.garcia@gmail.com | (713) 555-0245

PROFESSIONAL SUMMARY
OSHA-30 certified construction superintendent with 12 years of experience managing commercial and industrial construction projects valued at $10M–$150M across Texas.

EXPERIENCE

Senior Superintendent — Kiewit Corporation, Houston, TX (May 2019 – Present)
• Manage daily field operations for $120M petrochemical facility expansion project
• Oversee 150+ craft workers and 8 subcontractor crews across structural, mechanical, and electrical trades
• Achieved 500,000+ work hours with zero lost-time incidents (LTI-free since 2020)
• Maintained project schedule within 2% of baseline using Primavera P6 scheduling
• Coordinated with engineering on 200+ RFIs and 45 change orders

Project Superintendent — Turner Construction, Houston, TX (Jan 2016 – Apr 2019)
• Supervised construction of 22-storey Class A office tower ($85M, 450,000 SF)
• Managed concrete, steel, curtain wall, and MEP installation sequences
• Reduced punch list items by 40% through enhanced quality inspection programme
• Delivered project 3 weeks ahead of contractual substantial completion date

Assistant Superintendent — McCarthy Building Companies, Dallas, TX (Jun 2012 – Dec 2015)
• Supported superintendent on healthcare facility projects ($30M–$60M)
• Managed subcontractor scheduling and daily coordination meetings
• Conducted site safety inspections and OSHA compliance documentation
• Implemented BIM clash detection process reducing field conflicts by 25%

EDUCATION
Bachelor of Science in Construction Management — Texas A&M University, 2012

CERTIFICATIONS
OSHA 30-Hour Construction Safety
First Aid/CPR/AED Certified
Primavera P6 Scheduling Professional
LEED Green Associate

SKILLS
Field Operations, Subcontractor Management, Primavera P6, Procore, BIM/Revit Coordination, OSHA Compliance, Quality Control, RFI Management, Change Orders, Concrete/Steel Construction, MEP Coordination, Punch List Management, Safety Leadership`,
    jobDescriptionText: `Vice President of Operations — Bechtel Corporation (Houston, TX)

About Bechtel:
Bechtel is one of the most respected engineering, construction, and project management companies in the world.

Role:
Seeking a VP of Operations to oversee field construction operations for our Energy division in the Gulf Coast region.

Responsibilities:
• Provide executive oversight for multiple construction projects ($500M+ combined value)
• Lead and develop a team of 10+ superintendents and field engineers
• Ensure projects are delivered safely, on time, and within budget
• Drive safety culture achieving zero-harm targets across all projects
• Review and approve project schedules, budgets, and change management processes
• Build relationships with clients, EPC partners, and regulatory agencies

Requirements:
• 12+ years of construction management experience in industrial/energy sector
• Proven track record managing projects valued at $50M+
• Extensive knowledge of OSHA regulations and construction safety best practices
• Experience with Primavera P6, Procore, or similar construction management software
• Bachelor's degree in Construction Management, Engineering, or related field
• Strong leadership and team development skills

Preferred:
• Experience with petrochemical, LNG, or power generation projects
• LEED AP or sustainability certification
• PMP or CCM certification
• Experience working with unionised craft labour`,
    checks: {
      nameContains: "Robert",
      minExperience: 3,
      expectSkills: ["OSHA", "Primavera P6"],
      expectKeywords: ["construction", "safety"],
    },
  },
];

// ── Test runner (reused logic from test-diverse.ts) ──

interface AnalyzeResponse {
  candidateProfile: {
    name: string;
    experience: Array<{ title?: string; company?: string; bullets: string[] }>;
    education: Array<{ school?: string; degree?: string }>;
    skills: string[];
  };
  atsResult: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    gaps: string[];
  };
  rewritePreviews: Array<{ original: string; improved: string }>;
  radarResult?: {
    score: number;
    label: string;
    breakdown: Record<string, number>;
    blockers: Array<{ title: string }>;
  };
}

async function runTest(pair: TestPair, index: number): Promise<{ pass: boolean; issues: string[] }> {
  const label = `[${index + 1}/${TEST_PAIRS.length}] ${pair.country} — ${pair.sector} — ${pair.profession}`;
  console.log(`\n${label}`);
  console.log("─".repeat(60));

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

    // Check name
    if (pair.checks.nameContains) {
      if (data.candidateProfile.name?.toLowerCase().includes(pair.checks.nameContains.toLowerCase())) {
        console.log(`  Name: "${data.candidateProfile.name}" ✓`);
      } else {
        issues.push(`Name "${data.candidateProfile.name}" missing "${pair.checks.nameContains}"`);
        console.log(`  Name: "${data.candidateProfile.name}" ✗ (expected "${pair.checks.nameContains}")`);
      }
    }

    // Check experience
    const minExp = pair.checks.minExperience || 2;
    const expCount = data.candidateProfile.experience.length;
    const expPass = expCount >= minExp;
    console.log(`  Experience roles: ${expCount} ${expPass ? "✓" : "✗"} (need ${minExp}+)`);
    if (!expPass) issues.push(`Only ${expCount} experience roles parsed (need ${minExp}+)`);
    for (const exp of data.candidateProfile.experience) {
      console.log(`    → ${exp.title || "?"} at ${exp.company || "?"} (${exp.bullets.length} bullets)`);
    }

    // Check education
    const eduCount = data.candidateProfile.education.length;
    console.log(`  Education: ${eduCount} ${eduCount >= 1 ? "✓" : "✗"}`);
    if (eduCount < 1) issues.push("No education parsed");

    // Check skills
    const skillCount = data.candidateProfile.skills.length;
    console.log(`  Skills: ${skillCount} ${skillCount >= 5 ? "✓" : "✗"}`);
    if (skillCount < 5) issues.push(`Only ${skillCount} skills parsed`);

    // Check expected skills
    if (pair.checks.expectSkills) {
      const candidateSkillsLower = data.candidateProfile.skills.map((s) => s.toLowerCase());
      for (const expected of pair.checks.expectSkills) {
        const found = candidateSkillsLower.some((s) => s.includes(expected.toLowerCase()));
        if (!found) {
          issues.push(`Expected skill "${expected}" not found`);
          console.log(`  Skill "${expected}": ✗ missing`);
        }
      }
    }

    // ATS score
    console.log(`  ATS Score: ${data.atsResult.score}/100`);
    if (data.atsResult.score < 5) issues.push(`ATS score suspiciously low: ${data.atsResult.score}`);

    // Radar
    if (data.radarResult) {
      const b = data.radarResult.breakdown;
      console.log(`  Radar: ${data.radarResult.score}/100 (${data.radarResult.label})`);
      console.log(`    Hard: ${b.hardSkills} | Soft: ${b.softSkills} | Results: ${b.measurableResults} | Keywords: ${b.keywordOptimization} | Format: ${b.formattingBestPractices}`);
    }

    // Keywords
    console.log(`  Keywords — matched: ${data.atsResult.matchedKeywords.length}, missing: ${data.atsResult.missingKeywords.length}`);
    if (pair.checks.expectKeywords) {
      const allKw = [...data.atsResult.matchedKeywords, ...data.atsResult.missingKeywords].map((k) => k.toLowerCase());
      for (const expected of pair.checks.expectKeywords) {
        const found = allKw.some((k) => k.includes(expected.toLowerCase()));
        if (!found) console.log(`    Keyword "${expected}" not in matched or missing list`);
      }
    }

    // Rewrites
    console.log(`  Rewrite previews: ${data.rewritePreviews.length}`);

    // Result
    const pass = issues.length === 0;
    console.log(`\n  Result: ${pass ? "PASS ✓" : `FAIL ✗ (${issues.length} issues)`}`);
    return { pass, issues };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    issues.push(`Error: ${msg}`);
    console.log(`  ERROR: ${msg}`);
    return { pass: false, issues };
  }
}

async function main() {
  console.log("=== All-Sectors Test Suite (18 sectors) ===");
  console.log(`Testing against: ${BASE_URL}\n`);

  // Group by sector for readability
  const sectors = new Set(TEST_PAIRS.map((p) => p.sector));
  console.log(`Sectors: ${[...sectors].join(", ")}`);

  let passed = 0;
  let failed = 0;
  const failures: Array<{ label: string; issues: string[] }> = [];

  for (let i = 0; i < TEST_PAIRS.length; i++) {
    // Throttle to avoid rate limiting (1.5s between requests)
    if (i > 0) await new Promise((r) => setTimeout(r, 1500));
    const result = await runTest(TEST_PAIRS[i], i);
    if (result.pass) {
      passed++;
    } else {
      failed++;
      failures.push({
        label: `${TEST_PAIRS[i].country} — ${TEST_PAIRS[i].sector} — ${TEST_PAIRS[i].profession}`,
        issues: result.issues,
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${TEST_PAIRS.length}`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  ${f.label}:`);
      for (const issue of f.issues) {
        console.log(`    - ${issue}`);
      }
    }
  }

  console.log(`\nSectors tested: ${[...sectors].join(", ")}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
