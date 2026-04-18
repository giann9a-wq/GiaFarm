import { DocumentModule } from "@prisma/client";
import { env } from "@/lib/env";
import { getDriveClient } from "@/lib/google/client";
import { prisma } from "@/lib/prisma";

export type DriveFileInput = {
  googleDriveFileId: string;
  name: string;
  mimeType: string;
  module?: DocumentModule;
  folderPath?: string;
  webViewLink?: string | null;
  sizeBytes?: bigint | null;
  checksum?: string | null;
};

export async function ensureDriveRootConfigured() {
  if (!env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }
  return env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
}

export async function listDriveFolderFiles(folderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
  if (!folderId) return [];
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,webViewLink,size,md5Checksum,createdTime)",
    pageSize: 25
  });

  return response.data.files ?? [];
}

export async function registerDriveFile(input: DriveFileInput) {
  return prisma.driveFile.upsert({
    where: { googleDriveFileId: input.googleDriveFileId },
    update: {
      name: input.name,
      mimeType: input.mimeType,
      module: input.module ?? DocumentModule.GENERAL,
      folderPath: input.folderPath,
      webViewLink: input.webViewLink,
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      uploadedAt: new Date()
    },
    create: {
      googleDriveFileId: input.googleDriveFileId,
      name: input.name,
      mimeType: input.mimeType,
      module: input.module ?? DocumentModule.GENERAL,
      folderPath: input.folderPath,
      webViewLink: input.webViewLink,
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      uploadedAt: new Date()
    }
  });
}
