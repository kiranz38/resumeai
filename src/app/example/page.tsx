import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Example Analysis",
  description: "See a redacted example of ResumeMate AI's analysis comparing a software engineer resume against a real job description.",
};

export default function ExamplePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Example Analysis</h1>
        <p className="mt-2 text-gray-600">
          See what ResumeMate AI produces — using a redacted sample resume and job description.
        </p>
      </div>

      {/* Sample inputs */}
      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Sample Resume</h2>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold">S. CHEN</p>
            <p className="text-gray-500">Senior Software Engineer | San Francisco, CA</p>
            <p className="mt-3 font-medium text-gray-600">EXPERIENCE</p>
            <p className="mt-1 font-medium">Senior Software Engineer — [Company A] (2021-Present)</p>
            <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-gray-600">
              <li>Led development of customer-facing dashboard serving 50K+ MAU</li>
              <li>Built REST APIs using Node.js, reducing response times by 35%</li>
              <li>Mentored 3 junior engineers through code reviews</li>
            </ul>
            <p className="mt-2 font-medium">Software Engineer — [Company B] (2019-2021)</p>
            <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-gray-600">
              <li>Developed React components for e-commerce platform ($2M ARR)</li>
              <li>Implemented CI/CD pipeline, reducing deploy time by 87%</li>
            </ul>
            <p className="mt-3 font-medium text-gray-600">SKILLS</p>
            <p className="text-xs text-gray-600">JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, AWS, Docker</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Target Job Description</h2>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold">Senior Full-Stack Engineer — [Cloud Company]</p>
            <p className="mt-3 font-medium text-gray-600">Requirements:</p>
            <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-gray-600">
              <li>5+ years full-stack web development</li>
              <li>Expert TypeScript and React (Next.js preferred)</li>
              <li>Strong backend: Python or Go</li>
              <li>Cloud platforms (AWS, GCP, or Azure)</li>
              <li>Kubernetes and containerized deployments</li>
              <li>GraphQL APIs</li>
              <li>Infrastructure-as-code (Terraform, Pulumi)</li>
              <li>System design and architecture skills</li>
            </ul>
            <p className="mt-3 font-medium text-gray-600">Nice to Have:</p>
            <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-gray-600">
              <li>Real-time data processing (Kafka, Redis Streams)</li>
              <li>Open-source contributions</li>
              <li>Microservices architecture</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sample Results */}
      <div className="mb-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">What You Get</h2>

        {/* Score */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-yellow-400 bg-white">
              <span className="text-2xl font-bold text-yellow-600">58</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ATS Match Score: 58/100</h3>
              <p className="text-sm text-gray-600">
                Strong frontend skills but missing key technologies: Python/Go, Kubernetes, GraphQL, and infrastructure-as-code tools.
              </p>
            </div>
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Missing Keywords (Sample)</h3>
          <div className="flex flex-wrap gap-2">
            {["Python", "Go", "Kubernetes", "GraphQL", "Terraform", "Next.js", "System Design", "GCP", "Microservices"].map((kw) => (
              <span key={kw} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Rewrite sample */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Bullet Rewrite Sample</h3>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2">
              <span className="text-xs font-medium text-red-500 uppercase">Before</span>
              <p className="text-sm text-gray-600 line-through decoration-red-300">
                Built REST API endpoints using Node.js and Express, reducing response times by 35%
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-green-600 uppercase">After</span>
              <p className="text-sm font-medium text-gray-900">
                Designed and optimized high-throughput API layer using Node.js and Express, achieving 35% latency reduction through caching strategies and query optimization serving [N] daily requests
              </p>
            </div>
          </div>
        </div>

        {/* Pro features teaser */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Pro Pack Includes</h3>
          <p className="mb-4 text-sm text-gray-600">Everything above, plus:</p>
          <div className="grid gap-2 text-left text-sm text-gray-700 sm:grid-cols-2">
            {[
              "Full tailored resume rewrite",
              "Custom cover letter draft",
              "Complete keyword checklist",
              "Recruiter-style feedback",
              "All 12-20 bullet rewrites",
              "Experience gap analysis",
              "Skills section rewrite",
              "PDF, DOCX, TXT exports",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/analyze"
          className="rounded-lg bg-blue-800 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-900"
        >
          Analyze Your Resume
        </Link>
        <Link
          href="/demo"
          className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
        >
          Try Interactive Demo
        </Link>
      </div>
    </div>
  );
}
