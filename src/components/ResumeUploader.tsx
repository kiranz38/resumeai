"use client";

import { useCallback, useRef, useState } from "react";

interface ResumeUploaderProps {
  fileName: string | null;
  resumeText: string;
  disabled?: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onSwitchToPaste: () => void;
}

export default function ResumeUploader({
  fileName,
  resumeText,
  disabled,
  onFileUpload,
  onRemove,
  onSwitchToPaste,
}: ResumeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      // Create a synthetic event for the file upload handler
      const dt = new DataTransfer();
      dt.items.add(file);
      if (inputRef.current) {
        inputRef.current.files = dt.files;
        const syntheticEvent = {
          target: inputRef.current,
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileUpload(syntheticEvent);
      }
    },
    [onFileUpload],
  );

  // File already uploaded — show success state
  if (fileName) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 sm:p-8">
        <div className="relative z-10 text-center">
          {/* Animated checkmark */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-900">{fileName}</p>
          <p className="mt-1 text-sm text-gray-500">
            {resumeText.length.toLocaleString()} characters extracted
          </p>
          <button
            onClick={onRemove}
            className="mt-3 text-sm font-medium text-red-500 hover:text-red-700"
          >
            Remove and re-upload
          </button>
        </div>
      </div>
    );
  }

  // Upload area
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
        isDragging
          ? "scale-[1.02] border-2 border-blue-400 bg-blue-50 shadow-lg shadow-blue-100"
          : "border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-300 hover:from-blue-50/50 hover:to-indigo-50/50 hover:shadow-md"
      }`}
    >
      {/* Animated gradient border effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 50%, rgba(59,130,246,0.08) 100%)",
        }}
      />

      <label className="relative z-10 flex cursor-pointer flex-col items-center px-4 py-8 sm:px-8 sm:py-12">
        {/* Upload icon with animated ring */}
        <div className="relative mb-4 sm:mb-5">
          <div
            className={`flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl transition-all duration-300 ${
              isDragging
                ? "bg-blue-100 shadow-lg shadow-blue-200/50"
                : "bg-white shadow-sm group-hover:bg-blue-50 group-hover:shadow-md group-hover:shadow-blue-100/50"
            }`}
          >
            <svg
              className={`h-7 w-7 sm:h-10 sm:w-10 transition-all duration-300 ${
                isDragging
                  ? "scale-110 text-blue-600"
                  : "text-gray-400 group-hover:scale-105 group-hover:text-blue-500"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          {/* Pulsing ring on drag */}
          {isDragging && (
            <div className="animate-pulse-ring absolute inset-0 rounded-2xl" />
          )}
        </div>

        <p className="text-center text-base font-semibold text-gray-700">
          {isDragging ? (
            <span className="text-blue-600">Drop your resume here</span>
          ) : (
            <>
              <span className="text-blue-600 group-hover:underline">
                Click to upload
              </span>{" "}
              or drag and drop
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          PDF, DOCX, or TXT — up to 10 MB
        </p>

        {/* Supported formats badges */}
        <div className="mt-4 flex items-center gap-2">
          {["PDF", "DOCX", "TXT"].map((fmt) => (
            <span
              key={fmt}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={onFileUpload}
          className="hidden"
          disabled={disabled}
        />
      </label>

      {/* Switch to paste link */}
      <div className="border-t border-gray-100 px-4 py-3 text-center sm:px-8">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSwitchToPaste();
          }}
          className="text-sm text-gray-400 hover:text-blue-600"
        >
          Or paste your resume text instead
        </button>
      </div>
    </div>
  );
}
