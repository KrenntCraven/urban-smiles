export class FastApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function config() {
  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "") ?? "";
  const token = process.env.ADMIN_API_TOKEN?.trim() ?? "";
  return { base, token };
}

async function request(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { base, token } = config();
  if (!base || !token) {
    throw new FastApiError("FastAPI is not configured.", 500);
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = `FastAPI returned ${response.status}.`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Keep the status text when the error body is not JSON.
    }
    throw new FastApiError(detail, response.status);
  }

  return response;
}

export async function fetchFastApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await request(path, init);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function fetchFastApiFile(path: string) {
  const response = await request(path, {
    headers: { Accept: "*/*" },
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    bytes,
    mimeType:
      response.headers.get("content-type") ?? "application/octet-stream",
    filename:
      filenameFromDisposition(response.headers.get("content-disposition")) ??
      "document",
    size: bytes.byteLength,
  };
}

function filenameFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1];
}
