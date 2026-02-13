"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEMO_RESULT } from "@/lib/demo-data";
import { trackEvent } from "@/lib/analytics";

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    trackEvent("demo_clicked");
    // Store demo data in sessionStorage and redirect to results
    sessionStorage.setItem("rt_demo", JSON.stringify(DEMO_RESULT));
    router.push("/results");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Loading demo results...</p>
      </div>
    </div>
  );
}
