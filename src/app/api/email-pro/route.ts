import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { ProOutputSchema, type ProOutput } from "@/lib/schema";

const MAX_INPUT_SIZE = 500_000; // 500KB

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    const { allowed } = checkRateLimit(ip, { maxRequests: 3, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email delivery is not configured.", disabled: true },
        { status: 503 }
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_INPUT_SIZE) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }

    const body = JSON.parse(rawBody);
    const { email, proOutput, stripeSessionId } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 320) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    // Validate ProOutput with Zod
    const parsed = ProOutputSchema.safeParse(proOutput);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report data." }, { status: 400 });
    }

    const validOutput = parsed.data;

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
        // Don't block email if Stripe lookup fails (session might have expired)
      }
    }

    // Generate PDF and DOCX attachments server-side
    const { generateServerPDF } = await import("@/lib/export-pdf-server");
    const pdfBuffer = await generateServerPDF(validOutput);

    // Build text report for HTML body
    const textReport = buildTextReport(validOutput);

    // Send email with attachments
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "ResumeMate AI <reports@resumemate.ai>",
      to: email,
      subject: "Your ResumeMate AI Pro Report",
      html: buildEmailHTML(textReport),
      attachments: [
        {
          filename: "resumemate-ai-pro-report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[email-pro] Resend error:", error);
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
  lines.push("─".repeat(40));
  lines.push(output.tailoredResume.name.toUpperCase());
  lines.push(output.tailoredResume.headline);
  lines.push("");
  lines.push("Professional Summary:");
  lines.push(output.tailoredResume.summary);
  lines.push("");

  for (const exp of output.tailoredResume.experience) {
    lines.push(`${exp.title} — ${exp.company}${exp.period ? ` (${exp.period})` : ""}`);
    for (const b of exp.bullets) {
      lines.push(`  • ${b}`);
    }
    lines.push("");
  }

  lines.push("Skills:");
  for (const g of output.tailoredResume.skills) {
    lines.push(`  ${g.category}: ${g.items.join(", ")}`);
  }
  lines.push("");

  lines.push("COVER LETTER");
  lines.push("─".repeat(40));
  for (const p of output.coverLetter.paragraphs) {
    lines.push(p);
    lines.push("");
  }

  lines.push("NEXT ACTIONS");
  lines.push("─".repeat(40));
  output.nextActions.forEach((a: string, i: number) => {
    lines.push(`${i + 1}. ${a}`);
  });

  return lines.join("\n");
}

function buildEmailHTML(textReport: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e40af; font-size: 24px;">Your ResumeMate AI Pro Report</h1>
      <p style="color: #6b7280; font-size: 14px;">Thank you for using ResumeMate AI. Your full report is attached as a PDF.</p>
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
