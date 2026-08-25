/**
 * ID / HMO upload parsing for the booking action.
 * HMO needs at least the front of the card; self-pay needs a government ID.
 * Files stay in memory as FileBlob until store.ts persists them.
 *
 * Mime type comes from magic bytes, never from the browser Content-Type.
 * Stored filenames are `{kind}.jpg|png|webp` so download headers cannot be
 * injected from the original name.
 */
import type { CoverageType } from "./schema";
import type { DocumentKind } from "./records";
import type { FileBlob } from "./blobs";

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AcceptedMime = (typeof ACCEPTED_DOCUMENT_TYPES)[number];

type FileIssue = { field: DocumentKind; message: string };

export function readUpload(
  formData: FormData,
  field: DocumentKind,
): File | undefined {
  const value = formData.get(field);
  return value instanceof File && value.size > 0 ? value : undefined;
}

export function extensionForMime(mimeType: string): ".jpg" | ".png" | ".webp" {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

/** Safe ASCII name for storage and Content-Disposition. */
export function documentDownloadFilename(
  kind: DocumentKind,
  mimeType: string,
): string {
  return `${kind}${extensionForMime(mimeType)}`;
}

/** Headers for staff/admin ID photo responses. */
export function documentFileHeaders(
  kind: DocumentKind,
  blob: FileBlob,
): Record<string, string> {
  const filename = documentDownloadFilename(kind, blob.mimeType);
  return {
    "Content-Type": blob.mimeType,
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

/**
 * JPEG SOI, PNG signature, or RIFF/WEBP. Anything else is rejected even if
 * the browser labeled it image/jpeg.
 */
export function sniffImageMime(bytes: Uint8Array): AcceptedMime | undefined {
  if (bytes.length < 12) return undefined;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return undefined;
}

export async function parseRequiredDocuments(
  formData: FormData,
  coverageType: CoverageType,
): Promise<
  | { ok: true; documents: Partial<Record<DocumentKind, FileBlob>> }
  | { ok: false; issues: FileIssue[] }
> {
  const issues: FileIssue[] = [];
  const documents: Partial<Record<DocumentKind, FileBlob>> = {};

  const required: DocumentKind[] =
    coverageType === "hmo" ? ["hmoCardFront"] : ["governmentId"];
  const optional: DocumentKind[] =
    coverageType === "hmo" ? ["hmoCardBack"] : [];

  for (const field of [...required, ...optional]) {
    const file = readUpload(formData, field);
    if (!file) {
      if (required.includes(field)) {
        issues.push({
          field,
          message:
            field === "governmentId"
              ? "Upload a photo of a valid government-issued ID."
              : "Upload a photo of the front of your HMO card.",
        });
      }
      continue;
    }

    const parsed = await toBlob(file, field);
    if ("error" in parsed) {
      issues.push({ field, message: parsed.error });
    } else {
      documents[field] = parsed;
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, documents };
}

async function toBlob(
  file: File,
  kind: DocumentKind,
): Promise<FileBlob | { error: string }> {
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Keep each photo under 5 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) {
    return { error: "Keep each photo under 5 MB." };
  }

  const mimeType = sniffImageMime(bytes);
  if (!mimeType) {
    return { error: "Use a JPG, PNG, or WEBP photo." };
  }

  return {
    bytes,
    mimeType,
    filename: documentDownloadFilename(kind, mimeType),
    size: bytes.byteLength,
  };
}
