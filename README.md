# Urban Smiles

Marketing site and appointment request flow for a Metro Manila dental clinic. Patients browse treatments, meet the dentists, and submit a booking request from the home page, a service page, or `/book`. The clinic is fictional; the product shape is not.

This is a Next.js App Router app. Content lives in TypeScript catalogs, not a CMS. Booking validation is shared. Persistence is not wired up yet.

## What it does

- **Public marketing home** — hero, clinic philosophy, treatment cards, reviews with a before/after comparison, and an in-page four-step booking wizard.
- **Treatment pages** — overview, procedure steps, pricing, duration, FAQs, and a CTA that prefills the booking form for that service.
- **Dentist directory** (`/dentists`) — filter by specialty, open a profile, book with that dentist’s branch and usual treatment already selected.
- **Appointment requests** — one Zod schema, one server action. The home wizard, `/book`, and the service-page modal all submit the same payload.

A successful submit returns a reference like `US-260822-AB12`. Nothing is stored, emailed, or confirmed against a calendar. See [Booking backend](#booking-backend).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` |
| Motion | Framer Motion (section reveals, carousel, wizard steps); CSS parallax elsewhere |
| Validation | Zod (`src/lib/booking/schema.ts`) |
| Forms | Native `<form>` + `useActionState` on `/book`; React Hook Form on the home wizard |
| Images | `next/image`; staff photos in `public/team/` |

Node 20+ and npm are enough. There is no database, auth, or `.env` file.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

Regenerate favicons and app icons from the vector mark:

```bash
node scripts/generate-icons.mjs
```

That writes `src/app/icon.svg`, `src/app/apple-icon.png`, `src/app/favicon.ico`, and review previews under `design/icon-previews/`.

## Routes

| Path | Role |
| --- | --- |
| `/` | Marketing home + `#book` wizard |
| `/services/[slug]` | Treatment detail (statically generated) |
| `/dentists` | Clinical team directory |
| `/book` | Full-page booking form; accepts the same query string as the wizard |

Home section anchors used in nav: `/#philosophy`, `/#services`, `/#reviews`, `/#book`. Links in shared chrome are always root-relative (`/#services`, never `#services`) so they still work from `/dentists` and `/book`.

### Treatments

| Slug | Name |
| --- | --- |
| `routine-cleaning` | Routine Cleaning & Checkup |
| `teeth-whitening` | Professional Teeth Whitening |
| `dental-implants` | Dental Implants |
| `invisalign-clear-aligners` | Invisalign Clear Aligners |

### Branches

Four clinics, defined once in `LOCATIONS` (`src/lib/booking/schema.ts`):

| id | Branch |
| --- | --- |
| `bgc` | BGC — High Street |
| `makati` | Makati — Legazpi Village |
| `ortigas` | Ortigas — Emerald Avenue |
| `qc` | Quezon City — Katipunan |

### Dentists

| Slug | Also matches `?id=` | Role | Home branch |
| --- | --- | --- | --- |
| `amelia-santos` | `amelia` | Lead dentist & cosmetic | BGC |
| `benjamin-cruz` | `benjamin` | Orthodontist | Makati |
| `celine-reyes` | `celine` | Pediatric dentist | Quezon City |

## Booking

### Prefill query string

Every field is parsed independently. A bad `date` does not drop a valid `service`.

| Param | Example | Maps to |
| --- | --- | --- |
| `service` | `teeth-whitening` | Treatment |
| `dentist` | `amelia-santos` | Preferred dentist |
| `id` | `amelia` | Alias for dentist (campaign / `/dentists?id=` links) |
| `location` | `bgc` | Branch |
| `date` | `2026-08-25` | Preferred date (`YYYY-MM-DD`) |
| `time` | `10:00` | Preferred time (24-hour, from `TIME_SLOTS`) |

Examples:

```text
http://localhost:3000/?service=teeth-whitening&dentist=amelia-santos#book
http://localhost:3000/book?service=dental-implants&location=makati
http://localhost:3000/dentists?id=amelia
```

Helpers: `parseBookingPrefill`, `buildBookingHref` (`/book?…`), `buildQuickBookingHref` (`/?…#book`).

The home wizard also infers service or dentist from a same-origin referrer when the current URL has no explicit params — so arriving from `/services/teeth-whitening` still prefills. Explicit query params always win.

### Payload

Validated by `appointmentSchema` on the server (`submitAppointment` in `src/lib/booking/actions.ts`). Client-side checks on the wizard are convenience only.

| Field | Required |
| --- | --- |
| `serviceSlug` | Yes; must exist in the catalog |
| `locationId` | Yes; one of the four branch ids |
| `preferredDate` | Yes; today or later in Asia/Manila |
| `preferredTime` | Yes |
| `firstName`, `surname` | Yes |
| `middleName` | Yes unless `noMiddleName` is checked |
| `phone` | Yes; PH mobile `09XXXXXXXXX` or `+639XXXXXXXXX` |
| `email` | Yes on website bookings; optional on Messenger |
| `coverageType` | Yes; `hmo` or `self-pay` |
| HMO fields + card photos | Required when coverage is HMO |
| Government ID photo | Required when self-pay |
| `privacyConsent` | Must be true; Data Privacy Act of 2012 |
| `dentistSlug`, `suffix`, `notes` | Optional |

Submissions are stored in memory on the server process with status `pending_verification`. Front desk reviews them at `/staff` (not in the public nav). Set `STAFF_PIN` in the environment; see `.env.example`. Uploaded images are not in `public/` and are only served to a signed-in staff session.

On Vercel the in-memory queue does not survive cold starts. A database and object store still need wiring for production persistence.

### Wizard steps

`BRANCH` → `SERVICE` → `DATETIME` → `DETAILS` (identity, contact, coverage, consent). Choosing a dentist also sets their branch and default treatment; the patient can still change those.

## Layout of the repo

```text
src/app/                  Routes, layout, icons
src/components/
  sections/               Home blocks (Hero, Philosophy, …)
  booking/                Shared form + service-page modal
  team/                   Dentist cards, filter, profile dialog
  services/               FAQs, sticky booking card
src/lib/
  booking/                Schema, server action, form state
  services/               Catalog, types, formatters
  team/                   Roster and specialties
public/team/              Named staff photos
public/gallery/           Illustrative before/after SVGs (not patient photos)
scripts/generate-icons.mjs
```

Domain data is typed arrays at the top of a module, then mapped in JSX. Server Components are the default; `"use client"` is only for tabs, carousels, dialogs, and form state.

Design tokens (`cream`, `sand`, `ink`, `muted`, `teal`, `mint`, `gold`) live under `@theme` in `src/app/globals.css`. Do not use Tailwind’s default palette. Cursor rules in `.cursor/rules/` capture IA, product tone, design tokens, and UI patterns.

## What’s still open

**Booking backend.** `submitAppointment` validates, stores the request as pending verification, and mints a reference. SMS, email, and durable storage (database + object store) are not wired for production. Search the repo for `STAFF_PIN`.

**Home IA vs. the live page.** The intended home order in `.cursor/rules/dental-site-ia.mdc` still includes a sticky quick-book widget, a dedicated trust bar, a tabbed About, and a “Meet the dentists” block on `/`. Live home is hero → philosophy → services → reviews → embedded wizard. Dentists live on `/dentists`. The emergency `tel:` strip is in the header on every route.

**Placeholder social proof.** Review quotes are sample copy. The before/after slider uses labeled illustrations, not consented clinical photography. Replace both before a public launch.

**Content vs. product.** Prices, hours, HMOs, and the hotline `(02) 8888-8888` are demo data.

## Conventions worth knowing

- Dates must not be derived from `new Date()` during SSR; apply `min` on date inputs in an effect (see `AppointmentForm` and the wizard).
- One solid teal button per viewport; everything else is outline or text.
- Section `id`s rely on `scroll-padding-top` on `html`. Do not add `scroll-mt-*` on sections.
- Icon source of truth is the path in `scripts/generate-icons.mjs`, not hand-edited PNG files.
)