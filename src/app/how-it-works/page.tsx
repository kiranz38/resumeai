import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Upload your resume, paste a job description, and get instant ATS analysis with tailored rewrites.",
};

const STEPS = [
  {
    number: "1",
    title: "Upload your resume",
    description:
      "Upload a PDF, DOCX, or TXT file — or paste your resume text directly. Your document is parsed in your browser and never stored on our servers.",
  },
  {
    number: "2",
    title: "Paste the job description",
    description:
      "Copy and paste the job listing you're targeting. Our AI analyzes both documents to find gaps, missing keywords, and opportunities.",
  },
  {
    number: "3",
    title: "Get your results",
    description:
      "Instantly see your ATS Match Score, missing keywords, and sample bullet rewrites. Upgrade to unlock the full analysis with 12-20 rewrites, gap analysis, and a cover letter draft.",
  },
  {
    number: "4",
    title: "Apply the changes",
    description:
      "Use the copy buttons and downloadable report to update your resume. Each suggestion includes specific guidance on what to change and where.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          How it works
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Four simple steps to a tailored resume
        </p>

        <div className="mt-12 space-y-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {step.number}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/analyze"
            className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Check my resume
          </Link>
        </div>
      </div>
    </div>
  );
}
