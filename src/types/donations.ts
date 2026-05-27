export type DonationRecurrenceInterval = "monthly" | "bimonthly" | "quarterly" | "yearly";

export type DonationPaymentMode = "one_time" | "recurring";

export type DonationOrderStatus = "pending" | "completed" | "failed" | "cancelled";

export type DonationSubscriptionStatus = "active" | "paused" | "cancelled" | "past_due";

export type DonationAmountPreset = {
  id: string;
  label: string;
  title: string | null;
  description: string | null;
  checkout_url: string | null;
  is_recommended: boolean;
  card_style: "light" | "accent" | "dark";
  amount_cents: number;
  is_custom_amount: boolean;
  sort_order: number;
  is_enabled: boolean;
  allow_one_time: boolean;
  allow_monthly: boolean;
  allow_bimonthly: boolean;
  allow_quarterly: boolean;
  allow_yearly: boolean;
};

export type DonationOrder = {
  id: string;
  user_id: string | null;
  preset_id: string | null;
  amount_cents: number;
  currency: string;
  payment_mode: DonationPaymentMode;
  recurrence_interval: DonationRecurrenceInterval | null;
  status: DonationOrderStatus;
  donor_name: string | null;
  donor_email: string;
  stripe_checkout_session_id: string | null;
  created_at: string;
};

export type DonationSubscription = {
  id: string;
  user_id: string | null;
  order_id: string | null;
  amount_cents: number;
  currency: string;
  recurrence_interval: DonationRecurrenceInterval;
  status: DonationSubscriptionStatus;
  donor_name: string | null;
  donor_email: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
};
