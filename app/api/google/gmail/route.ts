import { NextResponse } from "next/server";
import { listScannerMessages } from "@/lib/google/gmail";
import { requireUser } from "@/lib/auth/permissions";

export async function GET() {
  await requireUser();

  try {
    const messages = await listScannerMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      {
        messages: [],
        error: error instanceof Error ? error.message : "Errore lettura Gmail."
      },
      { status: 503 }
    );
  }
}
