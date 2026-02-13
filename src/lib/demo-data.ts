import type { ResumeTailorResult } from "./schema";

export const DEMO_RESUME_TEXT = `SARAH CHEN
Senior Software Engineer | San Francisco, CA
sarah.chen@email.com | linkedin.com/in/sarahchen

EXPERIENCE

Senior Software Engineer — Acme Corp (2021–Present)
• Led development of customer-facing dashboard serving 50K monthly active users
• Built REST API endpoints using Node.js and Express, reducing response times by 35%
• Mentored 3 junior engineers through code reviews and pair programming sessions
• Collaborated with product team to define technical requirements for Q3 roadmap

Software Engineer — StartupXYZ (2019–2021)
• Developed React components for e-commerce platform processing $2M annual revenue
• Implemented CI/CD pipeline using GitHub Actions, reducing deployment time from 2 hours to 15 minutes
• Wrote unit and integration tests achieving 85% code coverage
• Participated in on-call rotation managing production incidents

Junior Developer — WebAgency (2017–2019)
• Built responsive websites for 20+ clients using HTML, CSS, and JavaScript
• Maintained WordPress sites and implemented custom plugins
• Assisted senior developers with database optimization tasks

EDUCATION
B.S. Computer Science — UC Berkeley, 2017

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git, GitHub Actions, AWS (EC2, S3), Docker, Agile/Scrum`;

export const DEMO_JD_TEXT = `Senior Full-Stack Engineer — CloudScale Inc.

About the Role:
We're looking for a Senior Full-Stack Engineer to join our Platform team. You'll build and scale our cloud infrastructure management platform used by thousands of enterprise customers.

Requirements:
• 5+ years of experience in full-stack web development
• Expert-level TypeScript and React (Next.js preferred)
• Strong backend experience with Python or Go
• Experience with cloud platforms (AWS, GCP, or Azure)
• Experience with Kubernetes and containerized deployments
• Strong understanding of CI/CD pipelines and DevOps practices
• Experience with GraphQL APIs
• Familiarity with infrastructure-as-code tools (Terraform, Pulumi)
• Strong system design and architecture skills
• Experience leading technical projects and mentoring engineers

Nice to Have:
• Experience with real-time data processing (Kafka, Redis Streams)
• Contributions to open-source projects
• Experience with microservices architecture
• Background in cloud security or compliance`;

export const DEMO_RESULT: ResumeTailorResult = {
  atsMatchScore: 58,
  interviewReadinessScore: 62,
  atsScoreExplanation:
    "Your resume matches about 58% of the job requirements. You have strong frontend skills and some cloud experience, but are missing key technologies like Python/Go, Kubernetes, GraphQL, and infrastructure-as-code tools that are explicitly required.",
  interviewScoreExplanation:
    "Your experience shows solid engineering fundamentals with good metrics. However, the resume could better demonstrate system design skills, technical leadership at scale, and cloud-native architecture experience that this senior role demands.",
  missingKeywords: [
    {
      keyword: "Python",
      category: "tools",
      importance: "high",
      reason: "Listed as a core backend requirement. The role needs Python or Go experience.",
      suggestedSection: "Skills + Experience bullet",
    },
    {
      keyword: "Go",
      category: "tools",
      importance: "high",
      reason: "Alternative backend language requirement alongside Python.",
      suggestedSection: "Skills",
    },
    {
      keyword: "Kubernetes",
      category: "tools",
      importance: "high",
      reason: "Containerized deployments with K8s is a core requirement for the Platform team.",
      suggestedSection: "Skills + Experience bullet",
    },
    {
      keyword: "GraphQL",
      category: "tools",
      importance: "high",
      reason: "The role specifically requires GraphQL API experience vs your REST background.",
      suggestedSection: "Skills + Experience bullet",
    },
    {
      keyword: "Terraform",
      category: "tools",
      importance: "medium",
      reason: "Infrastructure-as-code is required; Terraform or Pulumi experience needed.",
      suggestedSection: "Skills",
    },
    {
      keyword: "Next.js",
      category: "tools",
      importance: "medium",
      reason: "Listed as preferred React framework. You list React but not Next.js specifically.",
      suggestedSection: "Skills",
    },
    {
      keyword: "system design",
      category: "domain",
      importance: "high",
      reason: "Strong system design skills required for senior platform role.",
      suggestedSection: "Experience bullet demonstrating architecture decisions",
    },
    {
      keyword: "GCP",
      category: "tools",
      importance: "medium",
      reason: "Multi-cloud experience (AWS, GCP, Azure) is valued. You only mention AWS.",
      suggestedSection: "Skills",
    },
    {
      keyword: "microservices",
      category: "domain",
      importance: "medium",
      reason: "Nice-to-have but signals architectural maturity the team values.",
      suggestedSection: "Experience bullet",
    },
    {
      keyword: "real-time data processing",
      category: "domain",
      importance: "low",
      reason: "Nice-to-have: Kafka or Redis Streams experience for data pipeline work.",
      suggestedSection: "Skills or Experience bullet",
    },
    {
      keyword: "cloud security",
      category: "domain",
      importance: "low",
      reason: "Nice-to-have for enterprise platform dealing with compliance requirements.",
      suggestedSection: "Experience bullet",
    },
    {
      keyword: "technical leadership",
      category: "leadership",
      importance: "high",
      reason: "Role requires leading technical projects. Your mentoring experience is good but could be stronger.",
      suggestedSection: "Experience bullets at Acme Corp",
    },
  ],
  bulletRewrites: [
    {
      original:
        "Led development of customer-facing dashboard serving 50K monthly active users",
      rewritten:
        "Architected and led development of a customer-facing analytics dashboard serving 50K+ MAU, defining technical architecture and coordinating delivery across [N] engineers",
      section: "Acme Corp — Senior Software Engineer",
      improvementNotes:
        "Added architecture ownership and team coordination to demonstrate senior-level scope. Replace [N] with actual team size.",
    },
    {
      original:
        "Built REST API endpoints using Node.js and Express, reducing response times by 35%",
      rewritten:
        "Designed and optimized high-throughput API layer using Node.js and Express, achieving 35% latency reduction through caching strategies and query optimization serving [N] daily requests",
      section: "Acme Corp — Senior Software Engineer",
      improvementNotes:
        "Elevated from 'built' to 'designed and optimized' to show senior-level ownership. Added scale context. Fill in [N] with actual request volume.",
    },
    {
      original:
        "Mentored 3 junior engineers through code reviews and pair programming sessions",
      rewritten:
        "Mentored 3 junior engineers through structured code reviews and pair programming, contributing to [X]% improvement in team code quality metrics and onboarding velocity",
      section: "Acme Corp — Senior Software Engineer",
      improvementNotes:
        "Added measurable outcomes of mentoring. Replace [X]% with actual metrics if available.",
    },
    {
      original:
        "Collaborated with product team to define technical requirements for Q3 roadmap",
      rewritten:
        "Partnered with product and design stakeholders to translate business requirements into technical specifications for Q3 platform roadmap, influencing [N] key feature decisions",
      section: "Acme Corp — Senior Software Engineer",
      improvementNotes:
        "Strengthened with specific cross-functional impact. Shows strategic influence expected at senior level.",
    },
    {
      original:
        "Developed React components for e-commerce platform processing $2M annual revenue",
      rewritten:
        "Built and maintained React component library powering an e-commerce platform processing $2M+ annual revenue, improving page load performance by [X]% through code splitting and lazy loading",
      section: "StartupXYZ — Software Engineer",
      improvementNotes:
        "Added performance optimization angle and component library ownership. Fill in [X]% with actual improvement.",
    },
    {
      original:
        "Implemented CI/CD pipeline using GitHub Actions, reducing deployment time from 2 hours to 15 minutes",
      rewritten:
        "Designed and implemented CI/CD pipeline using GitHub Actions with automated testing and staged rollouts, reducing deployment cycle from 2 hours to 15 minutes (87% improvement)",
      section: "StartupXYZ — Software Engineer",
      improvementNotes:
        "Added DevOps maturity signals (staged rollouts, automated testing) relevant to the target role's CI/CD requirements.",
    },
    {
      original:
        "Wrote unit and integration tests achieving 85% code coverage",
      rewritten:
        "Established testing strategy with unit and integration tests achieving 85% code coverage, reducing production incidents by [X]% quarter-over-quarter",
      section: "StartupXYZ — Software Engineer",
      improvementNotes:
        "Elevated from task execution to strategy ownership. Added business impact metric placeholder.",
    },
    {
      original:
        "Participated in on-call rotation managing production incidents",
      rewritten:
        "Managed production incident response in on-call rotation, developing runbooks and monitoring dashboards that reduced mean time to resolution by [X]%",
      section: "StartupXYZ — Software Engineer",
      improvementNotes:
        "Transformed from passive participation to active improvement. Shows operational maturity valued in platform roles.",
    },
    {
      original:
        "Built responsive websites for 20+ clients using HTML, CSS, and JavaScript",
      rewritten:
        "Delivered 20+ responsive client websites using HTML, CSS, and JavaScript, managing concurrent projects and client relationships from requirements through launch",
      section: "WebAgency — Junior Developer",
      improvementNotes:
        "Added project management and client communication skills. Shows progression even in early career.",
    },
    {
      original:
        "Maintained WordPress sites and implemented custom plugins",
      rewritten:
        "Maintained and enhanced WordPress sites with custom plugin development, improving site performance and extending platform functionality for diverse client needs",
      section: "WebAgency — Junior Developer",
      improvementNotes:
        "Added value-oriented language showing impact rather than just maintenance.",
    },
    {
      original:
        "Assisted senior developers with database optimization tasks",
      rewritten:
        "Collaborated with senior engineers on PostgreSQL database optimization, contributing to query performance improvements that reduced page load times by [X]%",
      section: "WebAgency — Junior Developer",
      improvementNotes:
        "Specified database technology and added measurable outcome. Shows early interest in backend/data.",
    },
    {
      original: "",
      rewritten:
        "NEW BULLET: Contributed to system design decisions for [project name], evaluating trade-offs between monolithic and microservices architectures for [specific use case]",
      section: "Acme Corp — Senior Software Engineer (suggested addition)",
      improvementNotes:
        "Suggested new bullet to address the critical 'system design' gap. Customize with actual project details.",
    },
  ],
  experienceGaps: [
    {
      gap: "No Python or Go experience demonstrated",
      evidence:
        "Your skills list and experience bullets only mention JavaScript/TypeScript and Node.js for backend work.",
      suggestion:
        "If you have any Python or Go experience (even side projects, scripts, or contributions), add it to your Skills section and include a bullet demonstrating its use. If not, consider highlighting your ability to learn new languages quickly with a concrete example.",
      severity: "high",
    },
    {
      gap: "No Kubernetes or container orchestration beyond Docker",
      evidence:
        "You mention Docker in skills but the role requires Kubernetes experience for containerized deployments.",
      suggestion:
        "If you have K8s experience, add it explicitly. If you've worked with Docker Compose or ECS, mention container orchestration experience. Consider adding: 'Deployed containerized services using Docker and [orchestration tool] managing [N] services in production.'",
      severity: "high",
    },
    {
      gap: "No GraphQL experience shown",
      evidence:
        "Your API experience is REST-only (Node.js/Express). The role specifically requires GraphQL.",
      suggestion:
        "If you have GraphQL experience, add it to skills and reference it in an experience bullet. If not, this is a significant gap — consider building a small GraphQL project or noting willingness to ramp up in your cover letter.",
      severity: "high",
    },
    {
      gap: "No infrastructure-as-code experience",
      evidence:
        "No mention of Terraform, Pulumi, CloudFormation, or similar IaC tools.",
      suggestion:
        "If you've written any infrastructure code (even CloudFormation templates or Ansible playbooks), include it. The Platform team likely manages infrastructure programmatically.",
      severity: "medium",
    },
    {
      gap: "Limited cloud services depth",
      evidence:
        "You mention AWS (EC2, S3) but the role wants deeper cloud platform experience across AWS/GCP/Azure.",
      suggestion:
        "Expand your AWS skills to include services you've actually used (Lambda, RDS, CloudWatch, IAM, etc.). If you have any GCP or Azure experience, add it.",
      severity: "medium",
    },
    {
      gap: "System design experience not explicitly demonstrated",
      evidence:
        "No bullets describe architecture decisions, trade-off analysis, or system design work.",
      suggestion:
        "Add a bullet about a significant architecture decision you made. For example: 'Designed [system component] architecture, evaluating [options] and selecting [choice] to support [scale/requirement].'",
      severity: "high",
    },
  ],
  atsWarnings: [
    {
      issue: "No explicit job title match",
      location: "Resume header",
      fix: "Consider adding 'Full-Stack Engineer' or 'Senior Full-Stack Engineer' as a subtitle or in your summary, since the target role uses this title rather than 'Software Engineer'.",
      severity: "medium",
    },
    {
      issue: "Skills section uses comma-separated format",
      location: "Skills section",
      fix: "Comma-separated skills are generally ATS-safe, but consider grouping by category (Languages, Frameworks, Cloud, Tools) for better readability and keyword density.",
      severity: "low",
    },
    {
      issue: "No professional summary section",
      location: "Top of resume",
      fix: "Add a 2-3 sentence professional summary at the top that includes key terms from the job description: 'Senior Full-Stack Engineer with [N]+ years building scalable web platforms...' This helps ATS and human reviewers quickly match your profile.",
      severity: "medium",
    },
    {
      issue: "Date format inconsistency",
      location: "Experience section",
      fix: "Use consistent date formatting throughout. 'Present' is fine but ensure all date ranges follow the same pattern (e.g., 'Jan 2021 – Present' vs '2021–Present').",
      severity: "low",
    },
  ],
  skillsSectionRewrite:
    "SKILLS\n\nLanguages: JavaScript, TypeScript, Python (add if applicable)\nFrontend: React, Next.js, HTML, CSS\nBackend: Node.js, Express, GraphQL (add if applicable)\nCloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes (add if applicable), GitHub Actions, CI/CD\nInfrastructure: Terraform (add if applicable)\nDatabases: PostgreSQL, MongoDB\nMethodologies: Agile/Scrum, System Design, Technical Leadership",
  coverLetterDraft: `Dear Hiring Manager,

I'm writing to express my strong interest in the Senior Full-Stack Engineer position at CloudScale Inc. With [N]+ years of experience building and scaling web applications, I'm excited about the opportunity to contribute to your cloud infrastructure management platform.

In my current role as Senior Software Engineer at Acme Corp, I've led development of a customer-facing dashboard serving 50K+ monthly active users, making key architecture decisions and optimizing API performance. This experience building scalable, user-facing platforms directly aligns with CloudScale's mission to serve enterprise customers.

What draws me to this role specifically is the combination of platform engineering and customer impact. At StartupXYZ, I built the CI/CD pipeline that reduced deployment cycles by 87%, and I'm eager to apply that DevOps mindset to CloudScale's infrastructure management challenges. My experience mentoring engineers and collaborating with product stakeholders has prepared me for the technical leadership this role requires.

I'd welcome the opportunity to discuss how my experience with scalable web platforms, API design, and team leadership can contribute to CloudScale's Platform team. I'm particularly interested in learning more about your architecture challenges and how I can help solve them.

Best regards,
Sarah Chen`,
  nextActions: [
    "Add a professional summary section at the top of your resume targeting the 'Senior Full-Stack Engineer' title",
    "Expand your cloud skills: list all AWS services you've used, add any GCP/Azure experience",
    "Add a system design bullet to your Acme Corp experience demonstrating architecture decisions",
    "If you have Python, Go, Kubernetes, or GraphQL experience, add them prominently to Skills and Experience",
    "Consider grouping your Skills section by category for better ATS scanning and readability",
    "Tailor your job title or add a subtitle that matches 'Full-Stack Engineer' for ATS keyword matching",
  ],
  summary:
    "Your resume shows solid engineering experience with good metrics and progression. The main gaps are in specific technologies the role requires (Python/Go, Kubernetes, GraphQL, IaC) and in demonstrating senior-level system design and technical leadership. Focus on expanding your cloud/infrastructure skills and adding architecture-level accomplishments to strengthen your candidacy.",
};
