/**
 * Client-side file parser for PDF, DOCX, and TXT files.
 * Runs entirely in the browser — no server upload needed.
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return extractFromPDF(file);
    case "docx":
    case "doc":
      return extractFromDOCX(file);
    case "txt":
      return extractFromTXT(file);
    default:
      throw new Error(`Unsupported file type: .${extension}. Please use PDF, DOCX, or TXT.`);
  }
}

async function extractFromPDF(file: File): Promise<string> {
  // Dynamic import to keep bundle small
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) return item.str;
        return "";
      })
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n").trim();
}

async function extractFromDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractFromTXT(file: File): Promise<string> {
  return await file.text();
}
