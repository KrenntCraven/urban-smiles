/**
 * One-time consent flow that mints GOOGLE_OAUTH_REFRESH_TOKEN for the clinic
 * Gmail, so calendar invites are created as that user and guests are emailed.
 *
 * Sign in as the GOOGLE_CALENDAR_ID account when the browser opens. The token
 * is written back into .env.local; copy it to Vercel yourself.
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { google } from "googleapis";
import { CALENDAR_SCOPES } from "../src/lib/calendar/google";

const ENV_PATH = ".env.local";

const envFile = readFileSync(ENV_PATH, "utf8");
for (const line of envFile.split(/\r?\n/)) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^'(.*)'$/, "$1");
  }
}

/**
 * Google matches this string exactly against the client's authorized redirect
 * URIs, so it is overridable: a Web client only accepts what was registered,
 * and 127.0.0.1 and localhost are not interchangeable.
 */
const REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || "http://127.0.0.1:5488";
const redirect = new URL(REDIRECT_URI);
const PORT = Number(redirect.port || 80);

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
if (!clientId || !clientSecret) {
  console.error(
    `Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in ${ENV_PATH} first.\n` +
      "Google Cloud → APIs & Services → Credentials → Create credentials → OAuth client ID → Desktop app.",
  );
  process.exit(1);
}

const oauth = new google.auth.OAuth2({
  clientId,
  clientSecret,
  redirectUri: REDIRECT_URI,
});

/** `consent` forces a refresh token even if this account already approved. */
const authUrl = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: CALENDAR_SCOPES,
});

/** Rewrites the single key in place so the rest of .env.local is untouched. */
function persistRefreshToken(token: string) {
  const lines = envFile.replace(/\r\n/g, "\n").split("\n");
  const next = lines.filter(
    (line) => !line.startsWith("GOOGLE_OAUTH_REFRESH_TOKEN="),
  );
  while (next.length && next[next.length - 1] === "") next.pop();
  next.push(`GOOGLE_OAUTH_REFRESH_TOKEN=${token}`, "");
  writeFileSync(ENV_PATH, next.join("\r\n"));
}

async function main() {
  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", REDIRECT_URI);
      const received = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      // The browser also asks for /favicon.ico, and the tab may be opened by
      // hand before consent. Keep listening until Google actually calls back.
      if (!received && !error) {
        response.writeHead(404, { "content-type": "text/plain" });
        response.end("Waiting for Google. Finish the consent screen first.");
        return;
      }

      response.writeHead(200, { "content-type": "text/plain" });
      response.end(
        received
          ? "Urban Smiles calendar connected. You can close this tab."
          : `Consent failed: ${error}`,
      );
      server.close();
      if (received) resolve(received);
      else reject(new Error(`Google returned "${error}".`));
    });
    server.listen(PORT, redirect.hostname, () => {
      console.log(
        `Opening Google consent for ${process.env.GOOGLE_CALENDAR_ID ?? "the clinic calendar"}…`,
      );
      console.log(`Redirect URI in use: ${REDIRECT_URI}`);
      console.log(`If no browser opens, visit:\n${authUrl}\n`);
      spawn("cmd", ["/c", "start", "", authUrl], { stdio: "ignore" }).on(
        "error",
        () => undefined,
      );
    });
    server.on("error", reject);
  });

  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "Google returned no refresh token. Remove this app at " +
        "https://myaccount.google.com/permissions and run the script again.",
    );
    process.exit(1);
  }

  persistRefreshToken(tokens.refresh_token);
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN written to ${ENV_PATH}.`);
  console.log(
    "Add the same three GOOGLE_OAUTH_* values to Vercel, then redeploy.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
