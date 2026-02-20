"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FadeInOnScrollProps {
  children: ReactNode;
  /** Delay in ms before animation starts (useful for staggering) */
  delay?: number;
  /** Animation direction */
  direction?: "up" | "left" | "right" | "none";
  /** CSS class override */
  className?: string;
}

/**
 * Wraps children in a fade-in animation triggered on scroll into view.
 * Uses IntersectionObserver — no layout shift, respects prefers-reduced-motion.
 * Research: scroll-triggered reveals increase scroll depth and perceived quality.
 */
export default function FadeInOnScroll({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Respect reduced motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translateMap = {
    up: "translate-y-6",
    left: "translate-x-6",
    right: "-translate-x-6",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-y-0 translate-x-0"
          : `opacity-0 ${translateMap[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
