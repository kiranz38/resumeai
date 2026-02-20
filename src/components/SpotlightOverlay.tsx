"use client";

import { useEffect, useState, useCallback, type RefObject } from "react";

export interface SpotlightStep {
  targetRef: RefObject<HTMLElement | null>;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right";
}

interface SpotlightOverlayProps {
  steps: SpotlightStep[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export default function SpotlightOverlay({
  steps,
  currentStep,
  onNext,
  onSkip,
}: SpotlightOverlayProps) {
  const [cutout, setCutout] = useState<Rect | null>(null);

  const recalc = useCallback(() => {
    const step = steps[currentStep];
    if (!step?.targetRef.current) {
      setCutout(null);
      return;
    }
    const r = step.targetRef.current.getBoundingClientRect();
    // Use viewport-relative coords (no scroll offset) since overlay is fixed
    setCutout({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
  }, [steps, currentStep]);

  useEffect(() => {
    // Small delay to ensure target refs are mounted after phase change
    const timer = setTimeout(recalc, 100);

    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [recalc]);

  // Scroll target into view
  useEffect(() => {
    const step = steps[currentStep];
    if (step?.targetRef.current) {
      step.targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [steps, currentStep]);

  // Don't render until we have a valid cutout
  if (!cutout) return null;

  const step = steps[currentStep];
  const { placement } = step;

  // Tooltip positioning (viewport-relative since overlay is fixed)
  const tooltipStyle: React.CSSProperties = {};
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

  if (placement === "bottom") {
    tooltipStyle.top = cutout.top + cutout.height + 12;
    tooltipStyle.left = Math.min(cutout.left, viewportW - 340);
  } else if (placement === "top") {
    tooltipStyle.top = cutout.top - 12;
    tooltipStyle.left = Math.min(cutout.left, viewportW - 340);
    tooltipStyle.transform = "translateY(-100%)";
  } else if (placement === "right") {
    tooltipStyle.top = cutout.top;
    tooltipStyle.left = Math.min(cutout.left + cutout.width + 12, viewportW - 340);
  } else {
    tooltipStyle.top = cutout.top;
    tooltipStyle.left = Math.max(cutout.left - 12 - 320, 8);
  }

  // Clamp tooltip so it doesn't overflow viewport
  if (tooltipStyle.top && typeof tooltipStyle.top === "number") {
    tooltipStyle.top = Math.max(8, Math.min(tooltipStyle.top, viewportH - 180));
  }

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: "auto" }}>
      {/* Four-panel dark mask */}
      {/* Top */}
      <div
        className="absolute left-0 top-0 w-full bg-black/60 transition-all duration-300"
        style={{ height: Math.max(0, cutout.top) }}
      />
      {/* Bottom */}
      <div
        className="absolute left-0 w-full bg-black/60 transition-all duration-300"
        style={{ top: cutout.top + cutout.height, bottom: 0 }}
      />
      {/* Left */}
      <div
        className="absolute left-0 bg-black/60 transition-all duration-300"
        style={{ top: cutout.top, width: Math.max(0, cutout.left), height: cutout.height }}
      />
      {/* Right */}
      <div
        className="absolute bg-black/60 transition-all duration-300"
        style={{
          top: cutout.top,
          left: cutout.left + cutout.width,
          right: 0,
          height: cutout.height,
        }}
      />

      {/* Glow ring around cutout */}
      <div
        className="animate-spotlight-glow pointer-events-none absolute rounded-xl transition-all duration-300"
        style={{
          top: cutout.top,
          left: cutout.left,
          width: cutout.width,
          height: cutout.height,
        }}
      />

      {/* Tooltip card */}
      <div
        className="animate-slide-up-in absolute z-50 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        style={tooltipStyle}
      >
        <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Skip
            </button>
            <button
              onClick={onNext}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              {currentStep < steps.length - 1 ? "Next" : "Done"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
