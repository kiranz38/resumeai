"use client";

import { Suspense } from "react";
import type { DocResume } from "@/lib/pro-document";
import { TEMPLATES } from "@/lib/template-registry";

/** Realistic sample data so users can see how each template actually renders */
const SAMPLE_RESUME: DocResume = {
  name: "Sarah Mitchell",
  headline: "Senior Product Manager",
  email: "sarah.mitchell@email.com",
  phone: "(415) 555-0192",
  location: "San Francisco, CA",
  links: ["linkedin.com/in/sarahmitchell"],
  summary:
    "Results-driven product manager with 8+ years of experience leading cross-functional teams to deliver SaaS products used by 2M+ users. Track record of increasing revenue 40% YoY through data-informed roadmap prioritization and rapid experimentation.",
  skills: {
    groups: [
      { label: "Product", items: ["Roadmapping", "A/B Testing", "User Research", "Agile/Scrum", "SQL"] },
      { label: "Tools", items: ["Jira", "Figma", "Amplitude", "Mixpanel", "Tableau"] },
      { label: "Technical", items: ["Python", "SQL", "REST APIs", "Data Modeling"] },
    ],
  },
  experience: [
    {
      company: "Cloudwise Inc.",
      title: "Senior Product Manager",
      location: "San Francisco, CA",
      start: "Jan 2021",
      end: "Present",
      bullets: [
        "Led a team of 12 engineers and designers to launch a self-serve analytics platform, growing ARR from $8M to $14M within 18 months.",
        "Defined and executed product strategy for the enterprise tier, resulting in a 35% increase in average contract value.",
        "Reduced customer churn by 22% by implementing an in-app onboarding flow based on user research with 200+ customers.",
      ],
    },
    {
      company: "DataStream Labs",
      title: "Product Manager",
      location: "New York, NY",
      start: "Mar 2018",
      end: "Dec 2020",
      bullets: [
        "Owned the end-to-end product lifecycle for a real-time data pipeline serving 500+ enterprise clients.",
        "Shipped a connector marketplace that increased platform integrations by 3x and drove $2.1M in new revenue.",
        "Collaborated with engineering to reduce API latency by 60%, improving NPS from 32 to 58.",
      ],
    },
    {
      company: "TechNova",
      title: "Associate Product Manager",
      location: "Austin, TX",
      start: "Jun 2016",
      end: "Feb 2018",
      bullets: [
        "Launched a mobile-first dashboard used by 150K monthly active users within the first quarter.",
        "Conducted competitive analysis and user interviews to inform a product pivot that increased retention by 28%.",
      ],
    },
  ],
  education: [
    { school: "University of California, Berkeley", degree: "B.S. Business Administration", start: "2012", end: "2016" },
  ],
  projects: [
    {
      name: "Open Source Analytics SDK",
      bullets: [
        "Built and maintained an open-source JavaScript SDK for event tracking, adopted by 1,200+ projects on GitHub.",
      ],
    },
  ],
  certifications: ["Certified Scrum Product Owner (CSPO)", "Google Analytics Certified"],
};

interface TemplateChooserProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function TemplateChooser({
  selectedId,
  onSelect,
}: TemplateChooserProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Choose a Template
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Pick a style that fits your industry. You can switch templates any time.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {TEMPLATES.map((t) => {
          const isSelected = t.id === selectedId;
          const TemplateComponent = t.component;

          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`group relative flex flex-col rounded-xl border-2 p-3 text-left transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {/* Live template thumbnail — renders the real component scaled down */}
              <div className="mb-3 h-[280px] overflow-hidden rounded-lg border border-gray-100 bg-white">
                <div
                  className="origin-top-left pointer-events-none"
                  style={{
                    width: 800,
                    transform: "scale(0.234)",
                    transformOrigin: "top left",
                  }}
                >
                  <div className="p-6">
                    <Suspense
                      fallback={
                        <div className="flex h-40 items-center justify-center text-xs text-gray-300">
                          Loading...
                        </div>
                      }
                    >
                      <TemplateComponent resume={SAMPLE_RESUME} />
                    </Suspense>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-900">
                {t.name}
              </h3>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                {t.description}
              </p>

              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
