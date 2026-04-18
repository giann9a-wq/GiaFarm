import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().min(1).optional(),
  GOOGLE_GMAIL_SCANNER_LABEL: z.string().min(1).default("INBOX"),
  GOOGLE_SCANNER_EMAIL: z.string().email().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  ADMIN_EMAILS: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  GOOGLE_GMAIL_SCANNER_LABEL: process.env.GOOGLE_GMAIL_SCANNER_LABEL,
  GOOGLE_SCANNER_EMAIL: process.env.GOOGLE_SCANNER_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  APP_BASE_URL: process.env.APP_BASE_URL,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS
});

export function adminEmailsFromEnv() {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
