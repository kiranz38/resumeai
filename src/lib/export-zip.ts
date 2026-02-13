import type { ProOutput } from "./schema";

/**
 * Generate a ZIP containing 3 separate PDFs: Resume, Cover Letter, and Insights.
 */
export async function generateProPack(result: ProOutput): Promise<Blob> {
  const [JSZip, { generateResumePDF, generateCoverLetterPDF, generateInsightsPDF }] =
    await Promise.all([
      import("jszip").then((m) => m.default),
      import("./export-pdf"),
    ]);

  const [resumeBlob, coverLetterBlob, insightsBlob] = await Promise.all([
    generateResumePDF(result),
    generateCoverLetterPDF(result),
    generateInsightsPDF(result),
  ]);

  const zip = new JSZip();
  zip.file("Resume.pdf", resumeBlob);
  zip.file("Cover-Letter.pdf", coverLetterBlob);
  zip.file("Insights.pdf", insightsBlob);

  return zip.generateAsync({ type: "blob" });
}
