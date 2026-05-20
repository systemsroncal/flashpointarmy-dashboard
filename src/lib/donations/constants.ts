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
