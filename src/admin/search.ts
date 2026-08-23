import type { AdminBooking } from "./types";

/**
 * Front desk types whatever is in front of them: a name off a government ID, a
 * number read out over the phone, a member ID printed with dashes. None of that
 * matches how the value was stored, so both sides get flattened before compare.
 */
function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function digitsOf(value: string): string {
  return value.replace(/\D+/g, "");
}

/**
 * `normalizePhMobile` keeps whichever prefix the patient typed, so one mobile
 * is stored as either +639171234567 or 09171234567. Reducing both to the
 * national number lets either spelling find either record.
 */
function phoneKey(value: string): string {
  return digitsOf(value).replace(/^(?:63|0)+/, "");
}

const MIN_PHONE_DIGITS = 3;

export type SearchIndex = {
  text: string[];
  phone: string;
  digits: string[];
};

export function buildSearchIndex(booking: AdminBooking): SearchIndex {
  return {
    text: [
      booking.patientName,
      booking.email ?? "",
      booking.phone,
      booking.id,
      booking.serviceName,
      booking.branchName,
      booking.hmoProvider ?? "",
      booking.hmoMemberId ?? "",
      booking.notes ?? "",
      booking.appointmentDate,
    ]
      .filter(Boolean)
      .map(foldText),
    phone: phoneKey(booking.phone),
    digits: [digitsOf(booking.hmoMemberId ?? ""), digitsOf(booking.id)].filter(
      Boolean,
    ),
  };
}

/**
 * Every word has to match something, but each word may match a different field,
 * so "cruz maxicare" finds the Cruz record covered by Maxicare. Matching the
 * whole term against one concatenated string would only work in field order.
 */
export function matchesSearch(index: SearchIndex, term: string): boolean {
  const tokens = foldText(term).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => {
    if (index.text.some((field) => field.includes(token))) return true;

    const digits = digitsOf(token);
    if (!digits) return false;

    const national = phoneKey(token);
    if (national.length >= MIN_PHONE_DIGITS && index.phone.includes(national)) {
      return true;
    }
    return index.digits.some((field) => field.includes(digits));
  });
}
