import { GmailImportStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { getGmailClient } from "@/lib/google/client";
import { prisma } from "@/lib/prisma";

export type ScannerMailPreview = {
  messageId: string;
  from?: string;
  subject?: string;
  receivedAt?: Date;
  attachmentNames: string[];
};

function headerValue(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined,
  name: string
) {
  return (
    headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? undefined
  );
}

function collectAttachmentNames(
  parts: Array<{ filename?: string | null; parts?: unknown[] | null }> = []
): string[] {
  return parts.flatMap((part) => {
    const nested =
      Array.isArray(part.parts) &&
      part.parts.every((item) => typeof item === "object" && item !== null)
        ? collectAttachmentNames(part.parts as Array<{ filename?: string | null; parts?: unknown[] | null }>)
        : [];
    return part.filename ? [part.filename, ...nested] : nested;
  });
}

export async function listScannerMessages(): Promise<ScannerMailPreview[]> {
  const gmail = getGmailClient();
  const query = `has:attachment (${env.GOOGLE_GMAIL_SCANNER_LABEL})`;
  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 20
  });

  const messages = response.data.messages ?? [];
  const previews = await Promise.all(
    messages.map(async (message) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id ?? "",
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"]
      });
      const headers = detail.data.payload?.headers;
      const dateHeader = headerValue(headers, "Date");

      return {
        messageId: message.id ?? "",
        from: headerValue(headers, "From"),
        subject: headerValue(headers, "Subject"),
        receivedAt: dateHeader ? new Date(dateHeader) : undefined,
        attachmentNames: collectAttachmentNames(detail.data.payload?.parts ?? [])
      };
    })
  );

  return previews;
}

export async function createGmailImportDraft(preview: ScannerMailPreview) {
  return prisma.gmailImportSession.upsert({
    where: { id: preview.messageId },
    update: {
      fromEmail: preview.from,
      subject: preview.subject,
      receivedAt: preview.receivedAt,
      attachmentName: preview.attachmentNames[0],
      status: GmailImportStatus.DRAFT,
      draftPayload: preview
    },
    create: {
      id: preview.messageId,
      gmailMessageId: preview.messageId,
      fromEmail: preview.from,
      subject: preview.subject,
      receivedAt: preview.receivedAt,
      attachmentName: preview.attachmentNames[0],
      status: GmailImportStatus.DRAFT,
      draftPayload: preview
    }
  });
}
