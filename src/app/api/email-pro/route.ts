import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { parseAndValidate, EmailProRequestSchema } from "@/lib/sanitizer";
import { ProOutputSchema, type ProOutput } from "@/lib/schema";
import { validateEmailForDelivery } from "@/lib/email-validator";
import { runQualityGate } from "@/lib/quality-gate";

export async function POST(request: Request) {
  try {
    // Rate limit
    const { response: rateLimited } = rateLimitRoute(request, "email-pro");
    if (rateLimited) return rateLimited;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email delivery is not configured.", disabled: true },
        { status: 503 }
      );
    }

    // Parse + validate + sanitize input
    const { data, error } = await parseAndValidate(request, EmailProRequestSchema, "email-pro");
    if (error) return error;

    const { email, proOutput, stripeSessionId } = data;

    // Validate email (disposable domain blocking)
    const emailCheck = validateEmailForDelivery(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.reason }, { status: 400 });
    }

    // Validate ProOutput with canonical Zod schema
    const parsed = ProOutputSchema.safeParse(proOutput);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report data." }, { status: 400 });
    }

    // Run quality gate on the output to catch any stale/unprocessed data
    const { output: validOutput } = runQualityGate(parsed.data);

    // Stripe session verification (if Stripe is configured and session ID provided)
    if (process.env.STRIPE_SECRET_KEY && stripeSessionId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
        if (session.payment_status !== "paid") {
          return NextResponse.json({ error: "Payment not verified." }, { status: 403 });
        }
      } catch (err) {
        console.error("[email-pro] Stripe verification failed:", err instanceof Error ? err.message : "Unknown");
      }
    }

    // Generate all 3 PDF attachments server-side
    const { generateServerResumePDF, generateServerCoverLetterPDF, generateServerInsightsPDF } =
      await import("@/lib/export-pdf-server");
    const [resumeBuffer, coverLetterBuffer, insightsBuffer] = await Promise.all([
      generateServerResumePDF(validOutput),
      generateServerCoverLetterPDF(validOutput),
      generateServerInsightsPDF(validOutput),
    ]);

    // Build text report for HTML body
    const textReport = buildTextReport(validOutput);

    // Send email with attachments
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: sendError } = await resend.emails.send({
      from: "ResumeMate AI <onboarding@resend.dev>",
      to: email,
      subject: "Your ResumeMate AI Pro Pack",
      html: buildEmailHTML(textReport),
      attachments: [
        { filename: "Resume.pdf", content: resumeBuffer },
        { filename: "Cover-Letter.pdf", content: coverLetterBuffer },
        { filename: "Insights.pdf", content: insightsBuffer },
      ],
    });

    if (sendError) {
      console.error("[email-pro] Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    // Log masked email only
    console.log("[email-pro] Email sent to:", email.replace(/(.{2}).*(@.*)/, "$1***$2"));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[email-pro] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500 }
    );
  }
}

function buildTextReport(output: ProOutput): string {
  const lines: string[] = [];

  lines.push("TAILORED RESUME");
  lines.push("\u2500".repeat(40));
  lines.push(output.tailoredResume.name.toUpperCase());
  lines.push(output.tailoredResume.headline);
  lines.push("");
  lines.push("Professional Summary:");
  lines.push(output.tailoredResume.summary);
  lines.push("");

  for (const exp of output.tailoredResume.experience) {
    lines.push(`${exp.title} — ${exp.company}${exp.period ? ` (${exp.period})` : ""}`);
    for (const b of exp.bullets) {
      lines.push(`  \u2022 ${b}`);
    }
    lines.push("");
  }

  lines.push("Skills:");
  for (const g of output.tailoredResume.skills) {
    lines.push(`  ${g.category}: ${g.items.join(", ")}`);
  }
  lines.push("");

  lines.push("COVER LETTER");
  lines.push("\u2500".repeat(40));
  for (const p of output.coverLetter.paragraphs) {
    lines.push(p);
    lines.push("");
  }

  lines.push("NEXT ACTIONS");
  lines.push("\u2500".repeat(40));
  output.nextActions.forEach((a: string, i: number) => {
    lines.push(`${i + 1}. ${a}`);
  });

  return lines.join("\n");
}

function buildEmailHTML(textReport: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e40af; font-size: 24px;">Your ResumeMate AI Pro Pack</h1>
      <p style="color: #6b7280; font-size: 14px;">Thank you for using ResumeMate AI. Your Resume, Cover Letter, and Insights PDFs are attached.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px; color: #374151; background: #f9fafb; padding: 16px; border-radius: 8px;">${escapeHtml(textReport.slice(0, 50_000))}</pre>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Generated by ResumeMate AI. Your resume data was not stored.</p>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
