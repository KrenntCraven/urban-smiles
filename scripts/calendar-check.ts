/**
 * Diagnostic: reports which credential shape the calendar client will use and
 * proves it can reach GOOGLE_CALENDAR_ID. Run after changing calendar env.
 */
import { readFileSync } from "node:fs";
import { google } from "googleapis";
import { CLINIC_OAUTH_SCOPES } from "../src/lib/google/oauth";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^'(.*)'$/, "$1");
  }
}

async function main() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  console.log(`calendar id: ${calendarId ?? "(missing)"}`);
  console.log(
    `oauth: ${clientId && clientSecret && refreshToken ? "present" : "missing"}`,
  );
  console.log(
    `service account: ${process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "present" : "missing"}`,
  );

  if (!calendarId || !clientId || !clientSecret || !refreshToken) {
    console.error(
      "OAuth is incomplete, so approve would fall back to the service account.",
    );
    process.exit(1);
  }

  const auth = new google.auth.OAuth2({ clientId, clientSecret });
  auth.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth });
  const token = await auth.getAccessToken();
  console.log(`access token: ${token.token ? "granted" : "refused"}`);
  console.log(`scopes requested: ${CLINIC_OAUTH_SCOPES.join(", ")}`);
  if (token.token) {
    const info = await auth.getTokenInfo(token.token);
    console.log(`scopes granted: ${info.scopes ?? "(unknown)"}`);
  }

  const found = await calendar.calendars.get({ calendarId });
  console.log(`calendar reachable as: ${found.data.summary ?? calendarId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
