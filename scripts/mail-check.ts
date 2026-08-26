/**
 * One-shot: send a labeled test from the clinic Gmail via sendClinicEmail.
 * Usage: npx tsx scripts/mail-check.ts [recipient]
 */
import { readFileSync } from "node:fs";
import { sendClinicEmail } from "../src/lib/email/gmail";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^'(.*)'$/, "$1");
  }
}

function recipient(): string {
  const value =
    process.argv[2]?.trim().toLowerCase() ||
    process.env.MAIL_CHECK_TO?.trim().toLowerCase();
  if (!value) {
    console.error(
      "Pass a recipient: npx tsx scripts/mail-check.ts patient@example.com",
    );
    process.exit(1);
  }
  return value;
}

const to = recipient();

async function main() {
  await sendClinicEmail({
    to,
    subject: "Urban Smiles — mail test (not a booking)",
    text: [
      "This is a connectivity test from the booking system.",
      "If you received this, Gmail send is working.",
      `Sent at ${new Date().toISOString()}`,
    ].join("\n"),
    html: `<p>This is a connectivity test from the booking system.</p><p>If you received this, Gmail send is working.</p><p>Sent at ${new Date().toISOString()}</p>`,
  });
  console.log(`sent to ${to}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
