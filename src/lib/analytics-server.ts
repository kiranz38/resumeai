/**
 * Server-side analytics event logger.
 * Logs structured events without PII for observability.
 * In production, this could be extended to send to a metrics service.
 */

type EventParams = Record<string, string | number | boolean>;

// In-memory event counters for the admin funnel page
const eventCounts = new Map<string, number>();
const eventCountsWindow = new Map<string, number[]>(); // timestamps for rate calculation

/**
 * Track a server-side event. Logs to console and increments in-memory counters.
 */
export function trackServerEvent(eventName: string, params?: EventParams): void {
  // Increment counter
  eventCounts.set(eventName, (eventCounts.get(eventName) || 0) + 1);

  // Track timestamp for windowed rates
  const timestamps = eventCountsWindow.get(eventName) || [];
  timestamps.push(Date.now());
  // Keep only last hour
  const oneHourAgo = Date.now() - 3600_000;
  eventCountsWindow.set(
    eventName,
    timestamps.filter((t) => t > oneHourAgo),
  );

  // Log (no PII)
  const paramStr = params
    ? " " + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(" ")
    : "";
  console.log(`[event] ${eventName}${paramStr}`);
}

/**
 * Get aggregated event counts for the admin funnel page.
 */
export function getEventCounts(): Record<string, number> {
  return Object.fromEntries(eventCounts);
}

/**
 * Get event counts within the last hour.
 */
export function getHourlyEventCounts(): Record<string, number> {
  const oneHourAgo = Date.now() - 3600_000;
  const result: Record<string, number> = {};
  for (const [name, timestamps] of eventCountsWindow) {
    result[name] = timestamps.filter((t) => t > oneHourAgo).length;
  }
  return result;
}
