"use client";

import { useState, Suspense } from "react";
import type { DocResume } from "@/lib/pro-document";
import { TEMPLATES, getTemplate } from "@/lib/template-registry";

interface ExportBarProps {
  resume: DocResume;
  templateId: string;
  onTemplateChange: (id: string) => void;
}

export default function ExportBar({
  resume,
  templateId,
  onTemplateChange,
}: ExportBarProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const template = getTemplate(templateId);
  const TemplateComponent = template?.component;

  const hasEntitlement = () => {
    if (typeof window === "undefined") return false;
    const token = sessionStorage.getItem("rt_entitlement_token");
    return !!token;
  };

  const handleExport = async (format: "pdf" | "docx" | "txt") => {
    if (!hasEntitlement()) {
      setShowPaywall(true);
      return;
    }

    setExporting(format);
    try {
      const fileName = (resume.name || "resume").replace(/\s+/g, "_");

      if (format === "pdf") {
        const { renderResumePdf } = await import("@/lib/pdf-helpers");
        const proDoc = {
          resume,
          coverLetter: {
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            paragraphs: [],
            closing: "Sincerely,",
            signatureName: resume.name,
          },
        };
        const pdf = await renderResumePdf(proDoc);
        const blob = pdf.output("blob");
        downloadBlob(blob, `${fileName}.pdf`);
      } else if (format === "docx") {
        const { generateDOCXFromDocument } = await import("@/lib/export-docx");
        const proDoc = {
          resume,
          coverLetter: {
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            paragraphs: [],
            closing: "Sincerely,",
            signatureName: resume.name,
          },
        };
        const blob = await generateDOCXFromDocument(proDoc);
        downloadBlob(blob, `${fileName}.docx`);
      } else {
        const { proDocumentToText } = await import("@/lib/pro-document");
        const proDoc = {
          resume,
          coverLetter: {
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            paragraphs: [],
            closing: "Sincerely,",
            signatureName: resume.name,
          },
        };
        const text = proDocumentToText(proDoc);
        const blob = new Blob([text], { type: "text/plain" });
        downloadBlob(blob, `${fileName}.txt`);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Preview &amp; Export
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Review your resume and download it in your preferred format.
      </p>

      {/* Template switcher */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Template:</label>
        <select
          value={templateId}
          onChange={(e) => onTemplateChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Full preview */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[800px] p-6">
          {TemplateComponent && (
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  Loading template...
                </div>
              }
            >
              <TemplateComponent resume={resume} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport("pdf")}
          disabled={!!exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting === "pdf" ? (
            <Spinner />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Download PDF
        </button>

        <button
          onClick={() => handleExport("docx")}
          disabled={!!exporting}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {exporting === "docx" ? <Spinner /> : null}
          Download DOCX
        </button>

        <button
          onClick={() => handleExport("txt")}
          disabled={!!exporting}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {exporting === "txt" ? <Spinner /> : null}
          Download TXT
        </button>
      </div>

      {/* Paywall modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Upgrade to Export
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Creating and previewing your resume is free. To download as PDF,
              DOCX, or TXT, you need a Pro ($5) or Career Pass ($10) plan.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="/pricing"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Plans
              </a>
              <button
                onClick={() => setShowPaywall(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
