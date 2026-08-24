/**
 * Creates the government_id and hmo_id buckets if missing, then checks that
 * public.bookings (including calendar_event_id) exists.
 */
import { readFileSync } from "node:fs";
import {
  createSupabaseAdmin,
  GOVERNMENT_ID_BUCKET,
  HMO_ID_BUCKET,
} from "../src/lib/supabase/admin";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const buckets = [
  {
    id: GOVERNMENT_ID_BUCKET,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: HMO_ID_BUCKET,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
] as const;

async function main() {
  const supabase = createSupabaseAdmin();

  for (const bucket of buckets) {
    const existing = await supabase.storage.getBucket(bucket.id);
    if (existing.data) {
      console.log(`bucket ${bucket.id}: exists`);
      continue;
    }
    const created = await supabase.storage.createBucket(bucket.id, {
      public: false,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: [...bucket.allowedMimeTypes],
    });
    if (created.error) {
      console.error(`bucket ${bucket.id}: ${created.error.message}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`bucket ${bucket.id}: created`);
  }

  const { error } = await supabase
    .from("bookings")
    .select("id, calendar_event_id")
    .limit(1);
  if (error) {
    console.error(
      "bookings table is missing or calendar_event_id is not on it. Run supabase/schema.sql in the Supabase SQL editor.",
    );
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  console.log("bookings table: ready");
}

void main();
