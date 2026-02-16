"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">Verifying your payment...</p>
          </div>
        </div>
      }
    >
      <SuccessPage />
    </Suspense>
  );
}

interface VerifyResult {
  verified: boolean;
  transaction_id?: string;
  value?: number;
  currency?: string;
  plan?: string;
  error?: string;
}

function SuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const initStarted = useRef(false);

  const devToken = searchParams.get("dev_token");
  const sessionId = searchParams.get("session_id") || "";
  const plan = searchParams.get("plan") || "pro";
  const redirect = searchParams.get("redirect") || "/results/pro";
  const trackingId = devToken || sessionId;

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    if (!trackingId) {
      setStatus("error");
      setErrorMsg("No session ID found. Please try your purchase again.");
      return;
    }

    // ── Deduplication: skip if already tracked ──
    const storageKey = `ga4_purchase_${trackingId}`;
    if (localStorage.getItem(storageKey) === "true") {
      // Already tracked — redirect immediately
      navigateToDestination();
      return;
    }

    // ── Dev mode: skip Stripe verification, go straight through ──
    if (devToken) {
      localStorage.setItem(storageKey, "true");
      setStatus("success");
      setTimeout(() => navigateToDestination(), 600);
      return;
    }

    // ── Production: verify session server-side, then fire GA4 event ──
    async function verifyAndTrack() {
      try {
        const res = await fetch("/api/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, plan }),
        });

        const data: VerifyResult = await res.json();

        if (!data.verified) {
          setStatus("error");
          setErrorMsg(data.error || "Payment could not be verified.");
          return;
        }

        // ── Fire GA4 purchase event via gtag ──
        const w = window as unknown as { gtag?: (...args: unknown[]) => void };
        if (w.gtag) {
          w.gtag("event", "purchase", {
            transaction_id: data.transaction_id,
            value: data.value,
            currency: (data.currency || "usd").toUpperCase(),
            items: [
              {
                item_name: `ResumeMate AI — ${(data.plan || plan).charAt(0).toUpperCase() + (data.plan || plan).slice(1)}`,
                price: data.value,
                quantity: 1,
              },
            ],
          });
        }

        // ── Mark as tracked — prevents duplicates on refresh/back ──
        localStorage.setItem(storageKey, "true");

        setStatus("success");

        // Short delay so the user sees the confirmation, then redirect
        setTimeout(() => navigateToDestination(), 1200);
      } catch {
        setStatus("error");
        setErrorMsg("Network error during verification. Your payment was likely successful.");
      }
    }

    verifyAndTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigateToDestination() {
    // Preserve session_id/dev_token and plan in the redirect URL
    // so the destination page can exchange for entitlement token
    const sep = redirect.includes("?") ? "&" : "?";
    const params = devToken
      ? `dev_token=${encodeURIComponent(devToken)}&plan=${encodeURIComponent(plan)}`
      : `session_id=${encodeURIComponent(sessionId)}&plan=${encodeURIComponent(plan)}`;
    window.location.href = `${redirect}${sep}${params}`;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Verification Issue</h2>
          <p className="mt-2 text-sm text-gray-600">{errorMsg}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={navigateToDestination}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Continue anyway
            </button>
            <Link
              href="/pricing"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            If you completed payment, your results will still be available. Contact support@resumemate.ai if you need help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        {status === "verifying" ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-gray-700">Verifying your payment...</p>
            <p className="mt-1 text-xs text-gray-400">This only takes a moment</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900">Payment verified!</p>
            <p className="mt-1 text-sm text-gray-500">Redirecting to your results...</p>
          </>
        )}
      </div>
    </div>
  );
}
