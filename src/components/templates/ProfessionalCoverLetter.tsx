"use client";

import type { DocCoverLetter } from "@/lib/pro-document";

/**
 * Professional Letter Cover Letter Template
 * Classic business letter layout, ATS-safe, system fonts only.
 */
export default function ProfessionalCoverLetter({
  coverLetter,
  senderName,
}: {
  coverLetter: DocCoverLetter;
  senderName?: string;
}) {
  const cl = coverLetter;

  return (
    <div className="ats-cover-letter mx-auto max-w-[800px] bg-white text-gray-900">
      {/* Template label (UI only, hidden on print) */}
      <p className="mb-2 text-[10px] text-gray-400 print:hidden">
        Template: Professional Letter
      </p>

      {/* ── Date ── */}
      <p className="text-[14px] text-gray-600">{cl.date}</p>

      {/* ── Recipient ── */}
      <div className="mt-6">
        {cl.recipientLine && (
          <p className="text-[14px] text-gray-800">
            Dear {cl.recipientLine},
          </p>
        )}
        {(cl.company || cl.role) && (
          <p className="mt-0.5 text-[13px] text-gray-500">
            {[cl.role && `Re: ${cl.role}`, cl.company].filter(Boolean).join(" at ")}
          </p>
        )}
      </div>

      {/* ── Body ── */}
      <div className="mt-5 space-y-4">
        {cl.paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className="text-[14px] leading-[1.7] text-gray-700"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* ── Closing ── */}
      <div className="mt-8">
        <p className="text-[14px] text-gray-700">
          {cl.closing || "Sincerely,"}
        </p>
        <p className="mt-4 text-[14px] font-semibold text-gray-900">
          {cl.signatureName || senderName || ""}
        </p>
      </div>
    </div>
  );
}
