import { getStripeClient } from "@/lib/donations/stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid signature" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  async function completeOrder(orderId: string, extra: Record<string, unknown> = {}) {
    await admin
      .from("donation_orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
        ...extra,
      })
      .eq("id", orderId);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.donation_order_id;
    if (orderId) {
      await completeOrder(orderId, {
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      });

      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        const { data: order } = await admin
          .from("donation_orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (order?.recurrence_interval) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const periodEnd =
            "current_period_end" in sub && typeof sub.current_period_end === "number"
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null;
          await admin.from("donation_subscriptions").upsert(
            {
              user_id: order.user_id,
              order_id: orderId,
              amount_cents: order.amount_cents,
              currency: order.currency,
              recurrence_interval: order.recurrence_interval,
              status: sub.status === "active" ? "active" : "past_due",
              donor_name: order.donor_name,
              donor_email: order.donor_email,
              stripe_subscription_id: subId,
              stripe_customer_id:
                typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );
        }
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.donation_order_id;
    if (orderId) {
      await admin
        .from("donation_orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("status", "pending");
    }
  }

  return NextResponse.json({ received: true });
}
