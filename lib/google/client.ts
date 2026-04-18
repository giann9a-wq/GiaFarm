import { google } from "googleapis";
import { env } from "@/lib/env";

const googleScopes = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/gmail.readonly"
];

export function getServiceAccountAuth() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error("Google service account credentials are not configured.");
  }

  return new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: googleScopes,
    subject: env.GOOGLE_SCANNER_EMAIL
  });
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getServiceAccountAuth() });
}

export function getGmailClient() {
  return google.gmail({ version: "v1", auth: getServiceAccountAuth() });
}
