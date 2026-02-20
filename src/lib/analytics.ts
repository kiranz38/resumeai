type EventParams = Record<string, string | number | boolean>;

/**
 * Analytics wrapper that logs to console in dev and integrates with GA4 when configured.
 *
 * Tracked events:
 * — Funnel —
 * - landing_viewed                      Landing page seen
 * - upload_cta_clicked                  Hero CTA / uploader interaction started
 * - resume_uploaded                     File uploaded (fileType)
 * - job_description_started             JD textarea first input
 * - check_resume_clicked                Analyze button clicked
 * - match_score_shown                   Results page loaded with score (score_value)
 * - blockers_shown                      Blocker cards rendered (count)
 * - cta_visible                         Pro CTA scrolled into view
 * - sample_resume_clicked               "Try sample resume" clicked
 *
 * — Conversion —
 * - trial_clicked                       Trial ($1.50) CTA clicked
 * - pro_clicked                         Pro ($5) CTA clicked
 * - checkout_started                    Stripe checkout initiated (plan_name)
 * - purchase_success                    Payment confirmed (plan_name, value)
 * - purchase_canceled                   Checkout abandoned/canceled
 * - pro_generate_clicked                Generate Pro clicked
 * - pro_viewed                          Pro results loaded
 * - pro_generation_completed            Pro output received
 *
 * — Career —
 * - plan_selected                       Plan chosen in PaywallPlanPicker (plan, context)
 * - trial_upgrade_clicked               Upgrade from trial (context)
 * - career_pass_welcome_viewed          Welcome page loaded after purchase
 * - career_dashboard_viewed             Career dashboard page loaded
 * - checkout_button_clicked             Checkout button on pricing page (plan, source)
 *
 * — Engagement —
 * - radar_improvement_shown             Before/after radar delta (before, after)
 * - export_clicked                      Any export button (type)
 * - email_report_sent                   Email delivery triggered
 * - optimize_another_job_clicked        Return trigger on Pro page (plan)
 * - demo_clicked                        Demo CTA clicked
 * - share_clicked                       Share button clicked (platform)
 *
 * All events auto-include: device_type (mobile | desktop), page_name
 */

/** Detect mobile vs desktop */
function getDeviceType(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

/** Feature flag for funnel v2 */
export function isFunnelV2(): boolean {
  return process.env.NEXT_PUBLIC_FUNNEL_V2 === "true";
}

export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined") return;

  // Auto-enrich with device type
  const enriched: EventParams = {
    device_type: getDeviceType(),
    ...params,
  };

  // GA4 gtag
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", eventName, enriched);
  }

  // Always log in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${eventName}`, enriched);
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
