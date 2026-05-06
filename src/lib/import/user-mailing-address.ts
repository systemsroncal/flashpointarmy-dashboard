import {
  pickField,
  parseCityFromAddress,
  parseZipFromAddress,
  type FlatRow,
} from "@/lib/import/bulk-import";
import { resolveChapterUsState } from "@/lib/import/us-state";

export type UserMailingFields = {
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

/** Mailing / home address from the same Excel / Fluent columns used for chapter heuristics. */
export function userMailingAddressFromImportRow(row: FlatRow): UserMailingFields {
  const rawAddress = pickField(row, [
    "Address",
    "address",
    "address_line_1",
    "Address line 1",
    "Address Line 1",
  ]).trim();
  const churchStateRaw = pickField(row, [
    "Church State",
    "State",
    "state",
    "Church state",
    "input_text_3",
  ]);
  const city =
    (parseCityFromAddress(rawAddress) || pickField(row, ["City", "city"]).trim()) || null;
  const zip =
    (parseZipFromAddress(rawAddress) ||
      pickField(row, ["ZIP code", "Zip", "zip", "zip_code", "Postal code", "postal_code"]).trim()) ||
    null;
  const stateResolved = resolveChapterUsState({ churchStateRaw, address: rawAddress });
  const state = "error" in stateResolved ? null : stateResolved.code;
  const address_line = rawAddress || null;
  return { address_line, city, state, zip_code: zip };
}

/** Spread for auth.user_metadata (use nulls so keys can clear). */
export function mailingForUserMetadata(m: UserMailingFields): Record<string, string | null> {
  return {
    address_line: m.address_line,
    city: m.city,
    state: m.state,
    zip_code: m.zip_code,
  };
}
