"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            {item.question}
            <svg
              className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                openIndex === i ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === i && (
            <div className="px-6 pb-4 text-sm text-gray-600">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
