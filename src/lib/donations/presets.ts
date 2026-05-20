import type { DonationAmountPreset } from "@/types/donations";

export function presetAllowsMode(
  preset: DonationAmountPreset,
  paymentMode: "one_time" | "recurring",
  interval?: string | null
): boolean {
  if (paymentMode === "one_time") return preset.allow_one_time;
  if (!interval) return false;
  switch (interval) {
    case "monthly":
      return preset.allow_monthly;
    case "bimonthly":
      return preset.allow_bimonthly;
    case "quarterly":
      return preset.allow_quarterly;
    case "yearly":
      return preset.allow_yearly;
    default:
      return false;
  }
}

export function resolvePresetAmountCents(
  preset: DonationAmountPreset,
  customAmountCents?: number | null
): number | null {
  if (preset.is_custom_amount) {
    if (customAmountCents == null || customAmountCents <= 0) return null;
    return customAmountCents;
  }
  return preset.amount_cents;
}
