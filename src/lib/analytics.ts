type EventParams = Record<string, string | number | boolean>;

/**
 * Analytics wrapper that logs to console in dev and integrates with GA4 when configured.
 * Tracked events:
 * - resume_uploaded
 * - jd_pasted
 * - analysis_started
 * - analysis_generated
 * - pro_viewed
 * - pro_generate_clicked
 * - export_pdf_clicked
 * - export_docx_clicked
 * - export_txt_clicked
 * - demo_clicked
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined") return;

  // GA4 gtag
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", eventName, params);
  }

  // Always log in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${eventName}`, params || "");
  }
}

/**
 * Track page view (for SPA navigation).
 */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (w.gtag) {
    w.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] pageview: ${path}`);
  }
}
