"use client";

import { useReducer, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { resumeReducer, EMPTY_RESUME } from "@/lib/resume-reducer";
import { trackEvent } from "@/lib/analytics";
import {
  loadScratchResume,
  debouncedSave,
  loadScratchTemplate,
  saveScratchTemplate,
} from "@/lib/scratch-store";
import BuilderNav from "@/components/builder/BuilderNav";
import TemplateChooser from "@/components/builder/TemplateChooser";
import ContactForm from "@/components/builder/ContactForm";
import ExperienceForm from "@/components/builder/ExperienceForm";
import EducationForm from "@/components/builder/EducationForm";
import SkillsForm from "@/components/builder/SkillsForm";
import PreviewPanel from "@/components/builder/PreviewPanel";
import CompletenessBar from "@/components/builder/CompletenessBar";
import ExportBar from "@/components/builder/ExportBar";

const TOTAL_STEPS = 6;

export default function CreatePage() {
  const router = useRouter();
  const [resume, dispatch] = useReducer(resumeReducer, EMPTY_RESUME);
  const [templateId, setTemplateId] = useState("modern-ats");
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const trackedSteps = useRef<Set<number>>(new Set());

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadScratchResume();
    dispatch({ type: "SET_FULL", resume: saved });
    setTemplateId(loadScratchTemplate());
    setHydrated(true);
  }, []);

  // Track page view on mount
  useEffect(() => {
    if (!hydrated) return;
    trackEvent("builder_started");
  }, [hydrated]);

  // Track each step (once per step per session)
  const STEP_NAMES = ["template", "contact", "experience", "education", "skills", "export"];
  useEffect(() => {
    if (!hydrated) return;
    if (trackedSteps.current.has(step)) return;
    trackedSteps.current.add(step);
    trackEvent("builder_step_viewed", { step: step, step_name: STEP_NAMES[step] });
  }, [step, hydrated]);

  // Auto-save on every change (debounced)
  useEffect(() => {
    if (!hydrated) return;
    debouncedSave(resume);
  }, [resume, hydrated]);

  const handleTemplateChange = useCallback((id: string) => {
    setTemplateId(id);
    saveScratchTemplate(id);
    trackEvent("builder_template_selected", { template_id: id });
  }, []);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleQuickScan = useCallback(async () => {
    trackEvent("builder_quick_scan_clicked");
    const { proDocumentToText } = await import("@/lib/pro-document");
    const text = proDocumentToText({
      resume,
      coverLetter: {
        date: "",
        paragraphs: [],
        closing: "",
        signatureName: resume.name,
      },
    });
    sessionStorage.setItem("rt_resume_text", text);
    router.push("/analyze?action=upload");
  }, [resume, router]);

  // Don't render until hydrated to avoid flicker
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const renderStepForm = () => {
    switch (step) {
      case 0:
        return (
          <TemplateChooser
            selectedId={templateId}
            onSelect={(id) => {
              handleTemplateChange(id);
            }}
          />
        );
      case 1:
        return <ContactForm resume={resume} dispatch={dispatch} />;
      case 2:
        return <ExperienceForm resume={resume} dispatch={dispatch} />;
      case 3:
        return <EducationForm resume={resume} dispatch={dispatch} />;
      case 4:
        return <SkillsForm resume={resume} dispatch={dispatch} />;
      case 5:
        return (
          <ExportBar
            resume={resume}
            templateId={templateId}
            onTemplateChange={handleTemplateChange}
          />
        );
      default:
        return null;
    }
  };

  const showSidePreview = step >= 1 && step <= 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Resume Builder
              </h1>
              <p className="text-sm text-gray-500">
                Create a professional resume from scratch
              </p>
            </div>
            <a
              href="/analyze"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <BuilderNav
            currentStep={step}
            onStepClick={setStep}
            onBack={goBack}
            onNext={goNext}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {showSidePreview ? (
          <>
            {/* Desktop: side-by-side */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
              <div className="min-w-0">{renderStepForm()}</div>
              <div className="min-w-0">
                <div className="sticky top-6 space-y-4">
                  <CompletenessBar resume={resume} onQuickScan={handleQuickScan} />
                  <PreviewPanel resume={resume} templateId={templateId} />
                </div>
              </div>
            </div>

            {/* Mobile: form with preview toggle */}
            <div className="lg:hidden">
              {/* Mobile completeness */}
              <div className="mb-4">
                <CompletenessBar resume={resume} onQuickScan={handleQuickScan} />
              </div>

              {/* Mobile preview toggle */}
              <div className="mb-4 flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    !showMobilePreview
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowMobilePreview(true)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    showMobilePreview
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Preview
                </button>
              </div>

              {showMobilePreview ? (
                <div className="overflow-x-auto">
                  <PreviewPanel resume={resume} templateId={templateId} />
                </div>
              ) : (
                renderStepForm()
              )}
            </div>
          </>
        ) : (
          // Steps 0 (template chooser) and 5 (export) are full-width
          <div className="mx-auto max-w-4xl">{renderStepForm()}</div>
        )}
      </div>
    </div>
  );
}
