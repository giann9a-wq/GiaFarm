import { NextResponse } from "next/server";
import { listDriveFolderFiles } from "@/lib/google/drive";
import { requireUser } from "@/lib/auth/permissions";

export async function GET() {
  await requireUser();

  try {
    const files = await listDriveFolderFiles();
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      {
        files: [],
        error: error instanceof Error ? error.message : "Errore lettura Drive."
      },
      { status: 503 }
    );
  }
}
