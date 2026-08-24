/**
 * ID / HMO upload parsing for the booking action.
 * HMO needs at least the front of the card; self-pay needs a government ID.
 * Files stay in memory as FileBlob until store.ts persists them.
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

type FileIssue = { field: DocumentKind; message: string };

export function readUpload(
  formData: FormData,
  field: DocumentKind,
): File | undefined {
  const value = formData.get(field);
  return value instanceof File && value.size > 0 ? value : undefined;
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

    const parsed = await toBlob(file);
    if ("error" in parsed) {
      issues.push({ field, message: parsed.error });
    } else {
      documents[field] = parsed;
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, documents };
}

async function toBlob(file: File): Promise<FileBlob | { error: string }> {
  if (
    !ACCEPTED_DOCUMENT_TYPES.includes(
      file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number],
    )
  ) {
    return { error: "Use a JPG, PNG, or WEBP photo." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Keep each photo under 5 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    bytes,
    mimeType: file.type,
    filename: file.name || `${file.type.replace("/", ".")}`,
    size: file.size,
  };
}
