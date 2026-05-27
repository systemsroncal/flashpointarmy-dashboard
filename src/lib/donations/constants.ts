import type { DonationRecurrenceInterval } from "@/types/donations";

export const DONATION_RECURRENCE_OPTIONS: {
  value: DonationRecurrenceInterval;
  label: string;
}[] = [
  { value: "monthly", label: "Monthly" },
  { value: "bimonthly", label: "Every 2 months" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const DONATION_MIN_CUSTOM_CENTS = 100;
export const DONATION_MAX_CUSTOM_CENTS = 100_000_00;

/** Default SecureGive checkout used when an admin has not set a per-package URL. */
export const DONATION_DEFAULT_CHECKOUT_URL =
  "https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category";

export const DONATION_PARTNER_HERO_IMAGE = "/uploads/content/Become-a-Partner-Hero-Banner.png";
export const DONATION_PARTNER_INTRO_IMAGE = "/uploads/content/Become-a-Partner-Left-IMG-2.png";

export type DonationPackageCardStyle = "light" | "accent" | "dark";
