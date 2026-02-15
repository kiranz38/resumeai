"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Plan } from "@/lib/entitlement";

interface CheckoutButtonProps {
  plan: Plan;
  label: string;
  className?: string;
}

export default function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    trackEvent("checkout_button_clicked", { plan, source: "pricing" });

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const data = await res.json();

      if (data.devMode && data.token) {
        sessionStorage.setItem("rt_entitlement_token", data.token);
        sessionStorage.setItem("rt_entitlement_plan", plan);
        window.location.href = data.url;
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Redirect to analyze page as fallback
      window.location.href = "/analyze";
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}
