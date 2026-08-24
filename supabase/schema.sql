-- Urban Smiles bookings + private ID storage.
-- Run in the Supabase SQL editor if the setup script cannot apply it.
--
-- bookings: public form submissions (pending_verification until approved).
-- booking_files: metadata pointing at storage objects.
-- government_id / hmo_id: private buckets for patient documents.
-- calendar_event_id: Google event id, set only after events.insert succeeds.

create table if not exists public.bookings (
  id text primary key,
  patient_name text not null,
  phone text not null,
  email text,
  branch_id text not null,
  branch_name text not null,
  service_slug text not null,
  service_name text not null,
  appointment_date date not null,
  appointment_time time not null,
  coverage_type text not null,
  hmo_provider text,
  hmo_member_id text,
  is_new_patient boolean not null default false,
  notes text,
  status text not null default 'pending_verification',
  review_note text,
  decided_at timestamptz,
  decision text,
  staff_inbox text not null default '',
  appointment jsonb not null,
  -- Google Calendar event id written only after events.insert succeeds.
  calendar_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_branch_idx on public.bookings (branch_id);
create index if not exists bookings_date_idx on public.bookings (appointment_date);

alter table public.bookings add column if not exists calendar_event_id text;

create table if not exists public.booking_files (
  id bigint generated always as identity primary key,
  booking_id text not null references public.bookings (id) on delete cascade,
  kind text not null,
  filename text not null,
  mime_type text not null,
  size integer not null,
  bucket text not null,
  storage_path text not null,
  unique (booking_id, kind)
);

alter table public.bookings enable row level security;
alter table public.booking_files enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'government_id',
    'government_id',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'hmo_id',
    'hmo_id',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
