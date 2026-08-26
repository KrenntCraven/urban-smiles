/**
 * HTML for the rejection email. Colors match globals.css tokens (cream, ink,
 * teal, muted). Email clients ignore most CSS classes, so layout is tables
 * and inline styles. Fraunces/Inter are requested; Georgia/Arial are fallbacks.
 */
import type { BookingRecord } from "@/lib/booking/records";
import {
  formatPatientName,
  getLocationAddress,
  getLocationName,
} from "@/lib/booking/schema";
import { getServiceBySlug } from "@/lib/services/catalog";

const CREAM = "#fbfaf8";
const SAND = "#f1ede7";
const INK = "#0f2a26";
const MUTED = "#5a6b67";
const TEAL = "#0e5d52";
const HOTLINE_DISPLAY = "(02) 8888-8888";
const HOTLINE_TEL = "+63288888888";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteOrigin(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

function visitWhen(record: BookingRecord): string {
  const { preferredDate, preferredTime } = record.appointment;
  const stamp = Date.parse(`${preferredDate}T${preferredTime}:00+08:00`);
  if (Number.isNaN(stamp)) return `${preferredDate} ${preferredTime}`;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(stamp);
}

export function rejectEmailSubject(record: BookingRecord): string {
  const service =
    getServiceBySlug(record.appointment.serviceSlug)?.name ?? "appointment";
  return `Urban Smiles — we could not confirm your ${service} request`;
}

/** Full HTML document Gmail sends as `html`. */
export function rejectEmailHtml(record: BookingRecord, reason: string): string {
  const first = escapeHtml(record.appointment.firstName);
  const patient = escapeHtml(formatPatientName(record.appointment));
  const service = escapeHtml(
    getServiceBySlug(record.appointment.serviceSlug)?.name ??
      record.appointment.serviceSlug,
  );
  const branch = escapeHtml(
    getLocationName(record.appointment.locationId) ??
      record.appointment.locationId,
  );
  const address = getLocationAddress(record.appointment.locationId);
  const when = escapeHtml(visitWhen(record));
  const bookUrl = `${siteOrigin()}/book`;
  const note = escapeHtml(reason.trim());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Urban Smiles</title>
</head>
<body style="margin:0;padding:0;background:${SAND};color:${INK};font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CREAM};border-radius:16px;overflow:hidden;border:1px solid rgba(15,42,38,0.1);">
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${TEAL};font-weight:600;">Urban Smiles</p>
              <h1 style="margin:16px 0 0;font-family:Fraunces,Georgia,serif;font-size:28px;line-height:1.15;font-weight:600;color:${INK};">We could not confirm this visit</h1>
              <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${MUTED};">Hello ${first}, we reviewed the request for ${patient} and are not able to hold this appointment as submitted.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};border-radius:12px;">
                <tr>
                  <td style="padding:20px 20px 8px;font-size:14px;color:${MUTED};">Service</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 12px;font-size:16px;font-weight:600;color:${INK};">${service}</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 8px;font-size:14px;color:${MUTED};">When</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 12px;font-size:16px;font-weight:600;color:${INK};">${when}</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 8px;font-size:14px;color:${MUTED};">Branch</td>
                </tr>
                <tr>
                  <td style="padding:0 20px ${address ? "12px" : "20px"};font-size:16px;font-weight:600;color:${INK};">${branch}</td>
                </tr>
                ${
                  address
                    ? `<tr><td style="padding:0 20px 8px;font-size:14px;color:${MUTED};">Address</td></tr>
                <tr><td style="padding:0 20px 20px;font-size:16px;color:${INK};">${escapeHtml(address)}</td></tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 0;">
              <p style="margin:0;font-size:14px;letter-spacing:0.01em;text-transform:uppercase;color:${TEAL};font-weight:600;">Why</p>
              <p style="margin:8px 0 0;font-size:16px;line-height:1.6;color:${INK};">${note}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <a href="${bookUrl}" style="display:inline-block;background:${TEAL};color:${CREAM};text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:999px;">Book another time</a>
              <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">Questions? Call us at <a href="tel:${HOTLINE_TEL}" style="color:${TEAL};">${HOTLINE_DISPLAY}</a>. This message does not store a booking on our calendar.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function rejectEmailText(record: BookingRecord, reason: string): string {
  const service =
    getServiceBySlug(record.appointment.serviceSlug)?.name ??
    record.appointment.serviceSlug;
  const branch =
    getLocationName(record.appointment.locationId) ??
    record.appointment.locationId;
  const address = getLocationAddress(record.appointment.locationId);
  return [
    `Hello ${record.appointment.firstName},`,
    "",
    "Urban Smiles could not confirm this visit as submitted.",
    "",
    `Service: ${service}`,
    `When: ${visitWhen(record)}`,
    `Branch: ${branch}`,
    ...(address ? [`Address: ${address}`] : []),
    "",
    `Why: ${reason.trim()}`,
    "",
    `Book another time: ${siteOrigin()}/book`,
    `Hotline: ${HOTLINE_DISPLAY}`,
  ].join("\n");
}
