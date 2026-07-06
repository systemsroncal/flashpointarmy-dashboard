import { usStateByCode } from "@/data/usStates";
import { normalizeUsStateFromText, parseStateFromUsAddress } from "@/lib/import/us-state";

export type MobilizeGroupStateInfo = {
  code: string;
  name: string;
  flagSrc: string;
};

const FLAG_CDN =
  "https://cdn.jsdelivr.net/gh/CivilNet/us_state_flags@master/png";

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
  return `${FLAG_CDN}/${code.toLowerCase()}.png`;
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
  return { code, name: state.name, flagSrc: usStateFlagSrc(code) };
}
