/**
 * Email hardening: disposable domain blocking + validation.
 */

// Common disposable email domains (subset — extend as needed)
const DISPOSABLE_DOMAINS = new Set([
  "guerrillamail.com", "guerrillamail.de", "guerrillamail.net",
  "mailinator.com", "trashmail.com", "tempmail.com", "temp-mail.org",
  "throwaway.email", "yopmail.com", "yopmail.fr",
  "sharklasers.com", "guerrillamailblock.com", "grr.la",
  "discard.email", "discardmail.com", "mailnesia.com",
  "maildrop.cc", "fakeinbox.com", "tempail.com",
  "10minutemail.com", "minutemail.com", "emailondeck.com",
  "getnada.com", "mohmal.com", "harakirimail.com",
  "mailcatch.com", "tempr.email", "tmail.ws",
]);

/**
 * Validate an email for delivery:
 * - Format check
 * - Not a disposable domain
 * - Reasonable length
 */
export function validateEmailForDelivery(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, reason: "Email is required." };
  }

  if (email.length > 320) {
    return { valid: false, reason: "Email address is too long." };
  }

  // Basic format check
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 1 || atIndex === email.length - 1) {
    return { valid: false, reason: "Invalid email format." };
  }

  const domain = email.slice(atIndex + 1).toLowerCase();

  if (!domain.includes(".") || domain.length < 3) {
    return { valid: false, reason: "Invalid email domain." };
  }

  // Block disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "Disposable email addresses are not allowed. Please use a permanent email." };
  }

  return { valid: true };
}
