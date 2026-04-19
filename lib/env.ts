import { z } from "zod";

const required = (name: string) =>
  z
    .string({
      required_error: `${name} is required. Configure it in .env locally and in Vercel environment variables.`
    })
    .trim()
    .min(1, `${name} cannot be empty.`);

const optionalUrl = (name: string) =>
  z
    .string()
    .trim()
    .url(`${name} must be a valid URL.`)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalEmail = (name: string) =>
  z
    .string()
    .trim()
    .email(`${name} must be a valid email address.`)
    .optional()
    .or(z.literal("").transform(() => undefined));

const envSchema = z.object({
  DATABASE_URL: required("DATABASE_URL"),
  DIRECT_URL: required("DIRECT_URL"),
  AUTH_SECRET: required("AUTH_SECRET"),
  NEXTAUTH_URL: optionalUrl("NEXTAUTH_URL"),
  AUTH_URL: optionalUrl("AUTH_URL"),
  APP_BASE_URL: optionalUrl("APP_BASE_URL"),
  AUTH_GOOGLE_ID: required("AUTH_GOOGLE_ID"),
  AUTH_GOOGLE_SECRET: required("AUTH_GOOGLE_SECRET"),
  ADMIN_EMAILS: required("ADMIN_EMAILS"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().optional(),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().trim().optional(),
  GOOGLE_GMAIL_SCANNER_LABEL: z.string().trim().default("INBOX"),
  GOOGLE_SCANNER_EMAIL: optionalEmail("GOOGLE_SCANNER_EMAIL"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: optionalEmail("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional()
});

function parseEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    APP_BASE_URL: process.env.APP_BASE_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    GOOGLE_GMAIL_SCANNER_LABEL: process.env.GOOGLE_GMAIL_SCANNER_LABEL,
    GOOGLE_SCANNER_EMAIL: process.env.GOOGLE_SCANNER_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid GiaFarm environment configuration:\n${details}`);
  }

  return parsed.data;
}

export const env = parseEnv();

export function adminEmailsFromEnv() {
  const normalized = env.ADMIN_EMAILS
    .replaceAll("[", "")
    .replaceAll("]", "")
    .replaceAll('"', "")
    .replaceAll("'", "");

  const emailMatches = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);

  return Array.from(new Set(emailMatches?.map((email) => email.toLowerCase()) ?? []));
}
