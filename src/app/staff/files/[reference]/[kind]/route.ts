import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/booking/actions";
import type { DocumentKind } from "@/lib/booking/records";
import { getDocument } from "@/lib/booking/store";

const kinds = new Set<DocumentKind>([
  "hmoCardFront",
  "hmoCardBack",
  "governmentId",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string; kind: string }> },
) {
  if (!(await isStaffAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { reference, kind } = await context.params;
  if (!kinds.has(kind as DocumentKind)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = getDocument(reference, kind as DocumentKind);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
