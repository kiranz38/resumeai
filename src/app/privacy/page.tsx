import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ResumeMate AI privacy policy. We never store your resume or job description data.",
};

export default function PrivacyPage() {
  return (
    <div className="px-4 py-16">
      <div className="prose mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>

        <div className="mt-8 space-y-8 text-sm text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">What we collect</h2>
            <p className="mt-2">
              ResumeMate AI is built with privacy as a core principle. Here is exactly what we do and do not collect:
            </p>
            <h3 className="mt-4 font-semibold text-gray-900">We do NOT store:</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Your resume content or text</li>
              <li>Job description content or text</li>
              <li>Analysis results or AI outputs</li>
              <li>Personal information from your documents (name, email, phone, address)</li>
              <li>Uploaded files — all parsing happens in your browser</li>
            </ul>
            <h3 className="mt-4 font-semibold text-gray-900">We DO store:</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Anonymous event data (e.g., &quot;analysis_completed&quot;, &quot;checkout_started&quot;) for understanding product usage</li>
              <li>Anonymous session hashes (not linked to your identity)</li>
              <li>Payment records via Stripe (Stripe session ID, amount, timestamp) — we do not store your card details</li>
              <li>Performance timing metrics (e.g., time to complete analysis)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">How your data is processed</h2>
            <p className="mt-2">
              When you analyze your resume, your document is parsed in your browser. Only the extracted text is sent to our server for AI analysis. The text is processed in memory, used to generate your results, and immediately discarded. It is never written to a database, log file, or persistent storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            <p className="mt-2">
              Payments are handled entirely by Stripe. We never see or store your credit card number, CVV, or billing address. We only receive a confirmation that payment was successful, along with the Stripe session ID.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
            <p className="mt-2">
              We use Google Analytics 4 to track anonymous usage events (page views, button clicks, feature usage). No personal information is included in these events. You can block analytics by using a browser ad blocker.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
            <p className="mt-2">
              We use a short-lived httpOnly cookie (&quot;rt_paid&quot;) to verify your payment status for 24 hours. This cookie contains no personal information. Google Analytics may set its own cookies per its privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Your rights</h2>
            <p className="mt-2">
              Since we don&apos;t store your personal data, there is nothing to delete or export. If you have questions about our privacy practices, contact us at privacy@resumemate.ai.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
