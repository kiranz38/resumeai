import { describe, it, expect } from "vitest";
import { validateEmailForDelivery } from "@/lib/email-validator";

describe("validateEmailForDelivery", () => {
  it("should accept valid email", () => {
    expect(validateEmailForDelivery("user@example.com")).toEqual({ valid: true });
  });

  it("should reject empty email", () => {
    const result = validateEmailForDelivery("");
    expect(result.valid).toBe(false);
  });

  it("should reject email without @", () => {
    const result = validateEmailForDelivery("invalid");
    expect(result.valid).toBe(false);
  });

  it("should reject disposable email domains", () => {
    const result = validateEmailForDelivery("user@mailinator.com");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Disposable");
  });

  it("should reject another disposable domain", () => {
    const result = validateEmailForDelivery("test@guerrillamail.com");
    expect(result.valid).toBe(false);
  });

  it("should accept legitimate email domains", () => {
    expect(validateEmailForDelivery("user@gmail.com")).toEqual({ valid: true });
    expect(validateEmailForDelivery("user@company.org")).toEqual({ valid: true });
  });

  it("should reject overly long email", () => {
    const long = "a".repeat(310) + "@example.com"; // 322 chars > 320 limit
    const result = validateEmailForDelivery(long);
    expect(result.valid).toBe(false);
  });
});
