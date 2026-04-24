import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = await context.params;
  const file = await prisma.driveFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Documento non trovato." }, { status: 404 });
  }

  if (file.inlineDataBase64) {
    const bytes = Buffer.from(file.inlineDataBase64, "base64");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": file.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "private, no-store"
      }
    });
  }

  if (file.webViewLink) {
    return NextResponse.redirect(file.webViewLink);
  }

  return NextResponse.json(
    { error: "Il documento non ha un contenuto consultabile." },
    { status: 404 }
  );
}
