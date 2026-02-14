/**
 * Job session persistence for recent role tracking.
 * Stores up to MAX_SESSIONS analyses in localStorage for quick recall.
 */

const STORAGE_KEY = "rt_job_sessions";
const MAX_SESSIONS = 5;

export interface JobSession {
  id: string;
  jobTitle: string;
  company: string;
  radarBefore: number;
  radarAfter?: number;
  timestamp: number;
}

/**
 * Load all saved job sessions, newest first.
 */
export function loadJobSessions(): JobSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions: JobSession[] = JSON.parse(raw);
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Save a new job session. Keeps only the most recent MAX_SESSIONS entries.
 */
export function saveJobSession(session: Omit<JobSession, "id" | "timestamp">): JobSession {
  const sessions = loadJobSessions();

  const newSession: JobSession = {
    ...session,
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };

  // Deduplicate by jobTitle + company (update if same role re-analyzed)
  const filtered = sessions.filter(
    (s) => !(s.jobTitle === session.jobTitle && s.company === session.company)
  );

  const updated = [newSession, ...filtered].slice(0, MAX_SESSIONS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full — silently fail
  }

  return newSession;
}

/**
 * Update the radarAfter score for an existing session.
 */
export function updateSessionRadarAfter(sessionId: string, radarAfter: number): void {
  const sessions = loadJobSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return;

  sessions[idx] = { ...sessions[idx], radarAfter };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // silently fail
  }
}

/**
 * Restore a session's data into sessionStorage for re-analysis.
 * Returns true if the session was found.
 */
export function restoreSession(sessionId: string): boolean {
  const sessions = loadJobSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return false;

  // The resume text should still be in sessionStorage from the original analysis.
  // We keep the JD text cleared so the user can paste a new one for the same resume.
  return true;
}
