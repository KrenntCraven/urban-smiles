/**
 * Shared clinic Gmail OAuth. One refresh token covers calendar invites and
 * outbound mail (reject notices). Mint it with `npm run calendar:auth`.
 */
import { google } from "googleapis";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

/** Consent scopes for the clinic mailbox. JWT service accounts stay calendar-only. */
export const CLINIC_OAUTH_SCOPES = [CALENDAR_SCOPE, GMAIL_SEND_SCOPE];

export type OAuthCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

/** Reads the clinic Gmail OAuth trio minted by `npm run calendar:auth`. */
export function oauthCredentials(): OAuthCredentials | undefined {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return undefined;
  return { clientId, clientSecret, refreshToken };
}

/** OAuth2 client acting as the clinic Gmail. Undefined when the trio is missing. */
export function clinicOAuthClient() {
  const oauth = oauthCredentials();
  if (!oauth) return undefined;
  const auth = new google.auth.OAuth2({
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
  });
  auth.setCredentials({ refresh_token: oauth.refreshToken });
  return auth;
}
