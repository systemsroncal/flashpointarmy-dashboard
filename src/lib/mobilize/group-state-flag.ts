import { US_STATE_FLAG_URL_BY_FIPS } from "@/data/usStateFlagUrls";
import { usStateByCode } from "@/data/usStates";
import { normalizeUsStateFromText, parseStateFromUsAddress } from "@/lib/import/us-state";

export type MobilizeGroupStateInfo = {
  code: string;
  name: string;
  flagSrc: string;
};

/** Resolve USPS state code from Mobilize group fields (region_code, address, or name). */
export function resolveMobilizeGroupStateCode(input: {
  regionCode?: string | null;
  address?: string | null;
  name?: string | null;
}): string | null {
  const fromRegion = input.regionCode?.trim().toUpperCase();
  if (fromRegion && usStateByCode(fromRegion)) return fromRegion;

  const fromAddress = parseStateFromUsAddress(input.address);
  if (fromAddress) return fromAddress;

  const name = input.name?.trim();
  if (name) {
    const withoutChapter = name.replace(/\s+chapter\s*$/i, "").trim();
    const fromName = normalizeUsStateFromText(withoutChapter);
    if (fromName) return fromName;
  }

  return null;
}

export function usStateFlagSrc(code: string): string {
  const state = usStateByCode(code);
  if (!state) return "";
  return US_STATE_FLAG_URL_BY_FIPS[state.id] ?? "";
}

export function resolveMobilizeGroupStateInfo(input: {
  regionCode?: string | null;
  address?: string | null;
  name?: string | null;
}): MobilizeGroupStateInfo | null {
  const code = resolveMobilizeGroupStateCode(input);
  if (!code) return null;
  const state = usStateByCode(code);
  if (!state) return null;
  const flagSrc = usStateFlagSrc(code);
  if (!flagSrc) return null;
  return { code, name: state.name, flagSrc };
}
