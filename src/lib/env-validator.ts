/**
 * Environment variable validation at startup.
 * Warns about missing optional vars, errors on missing required vars.
 */

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
}

const ENV_SPECS: EnvVarSpec[] = [
  { name: "ANTHROPIC_API_KEY", required: false, description: "Claude API key for LLM Pro generation" },
  { name: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key for payments" },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", required: false, description: "Stripe publishable key" },
  { name: "RESEND_API_KEY", required: false, description: "Resend API key for email delivery" },
  { name: "STRIPE_WEBHOOK_SECRET", required: false, description: "Stripe webhook signing secret" },
  { name: "HMAC_SECRET", required: false, description: "HMAC secret for entitlement tokens" },
  { name: "NEXT_PUBLIC_PRICE_VARIANT", required: false, description: "Price in dollars for Pro pack" },
];

/**
 * Validate environment variables. Call at app startup.
 * Returns list of warnings/errors.
 */
export function validateEnv(): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const spec of ENV_SPECS) {
    const value = process.env[spec.name];
    if (!value || value.trim() === "") {
      if (spec.required) {
        errors.push(`Missing required env var: ${spec.name} — ${spec.description}`);
      } else {
        warnings.push(`Missing optional env var: ${spec.name} — ${spec.description}`);
      }
    }
  }

  // Validate MOCK_LLM is a proper boolean
  const mockLLM = process.env.MOCK_LLM;
  if (mockLLM && mockLLM !== "true" && mockLLM !== "false") {
    warnings.push(`MOCK_LLM should be "true" or "false", got "${mockLLM}"`);
  }

  // Validate price variant is a reasonable number
  const price = process.env.NEXT_PUBLIC_PRICE_VARIANT;
  if (price) {
    const num = parseInt(price, 10);
    if (isNaN(num) || num < 1 || num > 100) {
      warnings.push(`NEXT_PUBLIC_PRICE_VARIANT should be 1-100, got "${price}"`);
    }
  }

  return { warnings, errors };
}

/**
 * Log env validation results (call once at startup).
 */
export function logEnvValidation(): void {
  const { warnings, errors } = validateEnv();

  for (const w of warnings) {
    console.warn(`[env] ⚠ ${w}`);
  }
  for (const e of errors) {
    console.error(`[env] ✗ ${e}`);
  }

  if (errors.length > 0) {
    console.error(`[env] ${errors.length} required env var(s) missing. Some features will be unavailable.`);
  }
  if (warnings.length === 0 && errors.length === 0) {
    console.log("[env] All environment variables configured.");
  }
}
