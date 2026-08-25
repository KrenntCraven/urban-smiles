/**
 * Best-effort throttle for public booking submits.
 *
 * Counts live in this isolate only, so Vercel can still see bursts across
 * instances. It still stops one IP or email from filling Storage from a
 * single server. CAPTCHA would be the next step if this is not enough.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

type Bucket = { hits: number[] };

const ipHits = new Map<string, Bucket>();
const emailHits = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number): number[] {
  return bucket.hits.filter((at) => now - at < WINDOW_MS);
}

function take(
  store: Map<string, Bucket>,
  key: string,
  max: number,
  now: number,
): { ok: true } | { ok: false; retryMinutes: number } {
  const current = store.get(key) ?? { hits: [] };
  const hits = prune(current, now);
  if (hits.length >= max) {
    const oldest = hits[0] ?? now;
    const retryMs = WINDOW_MS - (now - oldest);
    return {
      ok: false,
      retryMinutes: Math.max(1, Math.ceil(retryMs / 60_000)),
    };
  }
  hits.push(now);
  store.set(key, { hits });
  if (store.size > 4_000) {
    for (const [entryKey, entry] of store) {
      if (prune(entry, now).length === 0) store.delete(entryKey);
    }
  }
  return { ok: true };
}

/** First public IP on the Vercel / proxy chain. */
export function requestIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headerList.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

/**
 * Records this submit against IP and email. Call only after the payload is
 * valid so typos do not burn the quota.
 */
export function consumeBookingSubmitQuota(input: {
  ip: string;
  email?: string;
}): { ok: true } | { ok: false; retryMinutes: number } {
  const now = Date.now();
  const ipResult = take(ipHits, input.ip.trim() || "unknown", MAX_PER_IP, now);
  if (!ipResult.ok) return ipResult;

  const email = input.email?.trim().toLowerCase();
  if (!email) return { ok: true };
  return take(emailHits, email.slice(0, 254), MAX_PER_EMAIL, now);
}
