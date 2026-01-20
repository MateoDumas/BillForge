import { Request, Response } from "express";
import Stripe from "stripe";
import { pool } from "../db";
import { SubscriptionStatus } from "../types";
import { alertService } from "../services/alertService";
import { AuditService } from "../services/auditService";

export async function stripeWebhookHandler(req: Request, res: Response) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).send("Stripe not configured");
  }

  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
    console.error("[Webhook] Missing Stripe signature");
    return res.status(400).send("Missing Stripe signature");
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed", err);
    return res.status(400).send("Webhook signature verification failed");
  }

  console.log(`[Webhook] Received event: ${event.type} [${event.id}]`);

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const invoiceId = intent.metadata && intent.metadata.invoiceId;

    if (!invoiceId) {
      console.log(`[Webhook] Payment succeeded but no invoiceId in metadata. Intent: ${intent.id}`);
      return res.json({ received: true });
    }

    console.log(`[Webhook] Payment succeeded for Invoice: ${invoiceId}. Updating status.`);

    await pool.query(
      "update payment set status = $1, external_payment_id = $2 where invoice_id = $3",
      ["succeeded", intent.id, invoiceId]
    );

    await pool.query(
      "update invoice set status = $1 where id = $2",
      ["paid", invoiceId]
    );

    // Update subscription status to active if it was past_due
    await pool.query(
      "update subscription set status = $1 where id = (select subscription_id from invoice where id = $2) and status = $3",
      [SubscriptionStatus.ACTIVE, invoiceId, SubscriptionStatus.PAST_DUE]
    );
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const invoiceId = intent.metadata && intent.metadata.invoiceId;

    if (!invoiceId) {
      console.log(`[Webhook] Payment failed but no invoiceId in metadata. Intent: ${intent.id}`);
      return res.json({ received: true });
    }

    console.warn(`[Webhook] Payment failed for Invoice: ${invoiceId}. Updating status.`);

    await AuditService.logSystem("webhook.payment_failed", "warning", `Payment failed for Invoice ${invoiceId}`, { invoiceId, paymentIntentId: intent.id });

    await pool.query(
      "update payment set status = $1, external_payment_id = $2 where invoice_id = $3",
      ["failed", intent.id, invoiceId]
    );

    await pool.query(
      "update invoice set status = $1 where id = $2",
      ["open", invoiceId]
    );

    // Update subscription status to past_due
    await pool.query(
      "update subscription set status = $1 where id = (select subscription_id from invoice where id = $2) and status = $3",
      [SubscriptionStatus.PAST_DUE, invoiceId, SubscriptionStatus.ACTIVE]
    );
  }

  return res.json({ received: true });
}
