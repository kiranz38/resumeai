"use client";

import { useRef } from "react";
import type { Dispatch } from "react";
import type { DocResume } from "@/lib/pro-document";
import type { ResumeAction } from "@/lib/resume-reducer";

interface ContactFormProps {
  resume: DocResume;
  dispatch: Dispatch<ResumeAction>;
}

export default function ContactForm({ resume, dispatch }: ContactFormProps) {
  const links = resume.links || [];
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({ type: "SET_PHOTO", photoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Contact Information
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Add your basic details so employers can reach you.
      </p>

      <div className="space-y-4">
        {/* Profile Photo (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Profile Photo <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <p className="mb-2 text-xs text-gray-400">
            Some templates display a photo in the header. Not recommended for US-based roles.
          </p>
          <div className="flex items-center gap-4">
            {/* Photo circle */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              {resume.photoUrl ? (
                <img
                  src={resume.photoUrl}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <svg className="h-8 w-8 text-gray-300 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/20">
                <svg className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {resume.photoUrl ? "Change photo" : "Upload photo"}
              </button>
              {resume.photoUrl && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_PHOTO", photoUrl: undefined })}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Full name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={resume.name}
            onChange={(e) =>
              dispatch({ type: "SET_CONTACT", field: "name", value: e.target.value })
            }
            placeholder="e.g. Jane Smith"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Headline */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Headline / Job Title
          </label>
          <input
            type="text"
            value={resume.headline || ""}
            onChange={(e) =>
              dispatch({ type: "SET_CONTACT", field: "headline", value: e.target.value })
            }
            placeholder="e.g. Senior Software Engineer"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Email + Phone row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={resume.email || ""}
              onChange={(e) =>
                dispatch({ type: "SET_CONTACT", field: "email", value: e.target.value })
              }
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={resume.phone || ""}
              onChange={(e) =>
                dispatch({ type: "SET_CONTACT", field: "phone", value: e.target.value })
              }
              placeholder="(555) 123-4567"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={resume.location || ""}
            onChange={(e) =>
              dispatch({ type: "SET_CONTACT", field: "location", value: e.target.value })
            }
            placeholder="e.g. San Francisco, CA"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Links */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Links
          </label>
          <p className="mb-2 text-xs text-gray-400">
            LinkedIn, portfolio, GitHub, etc.
          </p>
          {links.map((link, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => {
                  const updated = [...links];
                  updated[i] = e.target.value;
                  dispatch({ type: "SET_LINKS", links: updated });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    dispatch({ type: "SET_LINKS", links: [...links, ""] });
                  }
                }}
                placeholder="https://linkedin.com/in/..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  dispatch({
                    type: "SET_LINKS",
                    links: links.filter((_, j) => j !== i),
                  });
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Remove link"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => dispatch({ type: "SET_LINKS", links: [...links, ""] })}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add link
          </button>
        </div>
      </div>
    </div>
  );
}
