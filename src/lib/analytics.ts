type EventParams = Record<string, string | number | boolean>;

/**
 * Analytics wrapper that logs to console in dev and integrates with GA4 when configured.
 *
 * Tracked events:
 * — Funnel —
 * - landing_view                       Landing page seen
 * - cta_check_resume_clicked           Hero CTA clicked
 * - resume_input_started               User begins pasting/uploading resume
 * - resume_uploaded                    File uploaded
 * - jd_pasted                          JD text pasted
 * - analysis_started                   Analyze button clicked
 * - analysis_completed                 API returned free analysis (alias: analysis_generated)
 * - analysis_generated                 (legacy alias)
 * - radar_viewed                       Results page loaded (bucket: strong | needs_sharpening | signal_hidden)
 *
 * — Conversion —
 * - pro_cta_clicked                    Pro upgrade CTA clicked
 * - checkout_started                   Stripe checkout initiated
 * - checkout_completed                 Stripe payment confirmed
 * - pro_generate_clicked               Generate Pro clicked
 * - pro_viewed                         Pro results loaded
 * - pro_generation_completed           Pro output received
 *
 * — Engagement —
 * - radar_improvement_shown            Before/after radar delta displayed (before, after)
 * - export_clicked                     Any export button (type: zip | pdf | docx | txt | cover_pdf | insights_pdf)
 * - export_pdf_clicked                 (legacy alias)
 * - export_docx_clicked                (legacy alias)
 * - export_txt_clicked                 (legacy alias)
 * - export_zip_clicked
 * - export_resume_pdf_clicked
 * - export_cover_letter_pdf_clicked
 * - export_insights_pdf_clicked
 * - email_report_sent                  Email delivery triggered
 * - optimize_another_job_clicked       Return trigger on Pro page
 * - demo_clicked                       Demo CTA clicked
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
