"use client";

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import type { DocResume } from "@/lib/pro-document";
import { getTemplate } from "@/lib/template-registry";

interface PreviewPanelProps {
  resume: DocResume;
  templateId: string;
}

/** The template renders at this fixed width (px) */
const TEMPLATE_WIDTH = 800;

export default function PreviewPanel({ resume, templateId }: PreviewPanelProps) {
  const template = getTemplate(templateId);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const [innerH, setInnerH] = useState(1000);

  // Compute scale from container width so the template fills the panel
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    setScale(containerW / TEMPLATE_WIDTH);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  // Measure the actual template height so the outer wrapper matches
  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setInnerH(entry.contentRect.height);
    });
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [templateId]);

  if (!template) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Template not found. Select a template in Step 1.
      </div>
    );
  }

  const TemplateComponent = template.component;
  const scaledH = innerH * scale;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-2">
        <p className="text-xs font-medium text-gray-500">
          Live Preview &mdash; {template.name}
        </p>
      </div>

      {/* Scaled preview — fills container width, clips overflow */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: scaledH }}
      >
        <div
          ref={innerRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: TEMPLATE_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  Loading template...
                </div>
              }
            >
              <TemplateComponent resume={resume} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
