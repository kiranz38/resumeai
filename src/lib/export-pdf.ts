import type { ProOutput } from "./schema";
import type { RadarResult } from "./types";
import { proOutputToDocument } from "./pro-document";
import { renderResumePdf, renderCoverLetterPdf, renderInsightsPdf } from "./pdf-helpers";

/**
 * Generate a Resume PDF from ProOutput (client-side, returns Blob).
 */
export async function generateResumePDF(result: ProOutput): Promise<Blob> {
  const doc = proOutputToDocument(result);
  const pdf = await renderResumePdf(doc);
  return pdf.output("blob");
}

/**
 * Generate a Cover Letter PDF from ProOutput (client-side, returns Blob).
 */
export async function generateCoverLetterPDF(result: ProOutput): Promise<Blob> {
  const doc = proOutputToDocument(result);
  const pdf = await renderCoverLetterPdf(doc);
  return pdf.output("blob");
}

/**
 * Generate an Insights PDF from ProOutput (client-side, returns Blob).
 */
export async function generateInsightsPDF(result: ProOutput, radar?: RadarResult): Promise<Blob> {
  const pdf = await renderInsightsPdf(result, radar);
  return pdf.output("blob");
}

/**
 * Legacy combined PDF (resume + cover letter) for backwards compatibility.
 * @deprecated Use generateResumePDF / generateCoverLetterPDF individually.
 */
export async function generatePDF(result: ProOutput): Promise<Blob> {
  return generateResumePDF(result);
}
