import type { DonationPaymentMode, DonationRecurrenceInterval } from "@/types/donations";
import Stripe from "stripe";

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

type RecurringPrice = {
  interval: "day" | "week" | "month" | "year";
  interval_count: number;
};

function stripeRecurring(interval: DonationRecurrenceInterval): RecurringPrice {
  switch (interval) {
    case "monthly":
      return { interval: "month", interval_count: 1 };
    case "bimonthly":
      return { interval: "month", interval_count: 2 };
    case "quarterly":
      return { interval: "month", interval_count: 3 };
    case "yearly":
      return { interval: "year", interval_count: 1 };
    default:
      return { interval: "month", interval_count: 1 };
  }
}

export async function createDonationCheckoutSession(params: {
  orderId: string;
  amountCents: number;
  donorEmail: string;
  donorName?: string | null;
  paymentMode: DonationPaymentMode;
  recurrenceInterval?: DonationRecurrenceInterval | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  const priceData: {
    currency: string;
    unit_amount: number;
    product_data: { name: string };
    recurring?: RecurringPrice;
  } = {
    currency: "usd",
    unit_amount: params.amountCents,
    product_data: {
      name:
        params.paymentMode === "recurring" && params.recurrenceInterval
          ? `Recurring donation (${params.recurrenceInterval})`
          : "One-time donation",
    },
  };

  if (params.paymentMode === "recurring" && params.recurrenceInterval) {
    priceData.recurring = stripeRecurring(params.recurrenceInterval);
  }

  return stripe.checkout.sessions.create({
    mode: params.paymentMode === "recurring" ? "subscription" : "payment",
    customer_email: params.donorEmail,
    line_items: [
      {
        quantity: 1,
        price_data: priceData,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      donation_order_id: params.orderId,
    },
    subscription_data:
      params.paymentMode === "recurring"
        ? {
            metadata: {
              donation_order_id: params.orderId,
            },
          }
        : undefined,
  });
}
