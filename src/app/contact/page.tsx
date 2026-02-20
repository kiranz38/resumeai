import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ResumeMate AI team.",
};

export default function ContactPage() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Contact us</h1>
        <p className="mt-2 text-gray-600">
          Have questions, feedback, or need support? Reach out to us.
        </p>

        <div className="mt-8 space-y-6 text-sm text-gray-700">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900">General inquiries</h2>
            <p className="mt-1">
              <a href="mailto:hello@resumemate.ai" className="text-primary hover:underline">
                hello@resumemate.ai
              </a>
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900">Support &amp; refunds</h2>
            <p className="mt-1">
              <a href="mailto:support@resumemate.ai" className="text-primary hover:underline">
                support@resumemate.ai
              </a>
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900">Privacy questions</h2>
            <p className="mt-1">
              <a href="mailto:privacy@resumemate.ai" className="text-primary hover:underline">
                privacy@resumemate.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
