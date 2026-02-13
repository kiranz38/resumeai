import { type ClassValue, clsx } from "clsx";

// Minimal clsx implementation (avoid extra dependency)
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function generateSessionHash(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getSessionHash(): string {
  if (typeof window === "undefined") return "";
  let hash = sessionStorage.getItem("rt_session_hash");
  if (!hash) {
    hash = generateSessionHash();
    sessionStorage.setItem("rt_session_hash", hash);
  }
  return hash;
}
