/**
 * Environment variable validation.
 * Validates required env vars at import time.
 * Import this in critical entry points (layout.tsx, API routes).
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    const msg = `Missing required environment variable: ${name}`;
    console.error(JSON.stringify({
      level: "FATAL",
      timestamp: new Date().toISOString(),
      where: "env-validation",
      message: msg,
    }));
    throw new Error(msg);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  CRON_SECRET: process.env.CRON_SECRET,
} as const;
