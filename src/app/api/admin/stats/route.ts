import { NextResponse } from "next/server";
import { getEventCounts, getHourlyEventCounts } from "@/lib/analytics-server";
import { getGatewayHealth } from "@/lib/llm-gateway";

/**
 * Admin stats endpoint — returns server-side event counts and gateway health.
 * Protected by ADMIN_SECRET env var.
 */
export async function GET(request: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured." }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    events: getEventCounts(),
    hourly: getHourlyEventCounts(),
    gateway: getGatewayHealth(),
    uptime: process.uptime(),
  });
}
