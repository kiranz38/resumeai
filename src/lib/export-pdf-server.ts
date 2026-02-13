import type { ProOutput } from "./schema";
import { proOutputToDocument } from "./pro-document";
import { renderResumePdf, renderCoverLetterPdf, renderInsightsPdf } from "./pdf-helpers";

/**
 * Generate a Resume PDF server-side (returns Buffer for email attachments).
 */
export async function generateServerResumePDF(result: ProOutput): Promise<Buffer> {
  const doc = proOutputToDocument(result);
  const pdf = await renderResumePdf(doc);
  return Buffer.from(pdf.output("arraybuffer"));
}

/**
 * Generate a Cover Letter PDF server-side (returns Buffer for email attachments).
 */
export async function generateServerCoverLetterPDF(result: ProOutput): Promise<Buffer> {
  const doc = proOutputToDocument(result);
  const pdf = await renderCoverLetterPdf(doc);
  return Buffer.from(pdf.output("arraybuffer"));
}

/**
 * Generate an Insights PDF server-side (returns Buffer for email attachments).
 */
export async function generateServerInsightsPDF(result: ProOutput): Promise<Buffer> {
  const pdf = await renderInsightsPdf(result);
  return Buffer.from(pdf.output("arraybuffer"));
}

/**
 * Legacy combined PDF for backwards compatibility.
 * @deprecated Use the individual generators.
 */
export async function generateServerPDF(result: ProOutput): Promise<Buffer> {
  return generateServerResumePDF(result);
}
