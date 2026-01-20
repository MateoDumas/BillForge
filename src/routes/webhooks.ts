import { Request, Response } from "express";
import Stripe from "stripe";
import { pool } from "../db";

export async function stripeWebhookHandler(req: Request, res: Response) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).send("Stripe not configured");
  }

  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
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
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const invoiceId = intent.metadata && intent.metadata.invoiceId;

    if (!invoiceId) {
      return res.json({ received: true });
    }

    await pool.query(
      "update payment set status = $1, external_payment_id = $2 where invoice_id = $3",
      ["succeeded", intent.id, invoiceId]
    );

    await pool.query(
      "update invoice set status = $1 where id = $2",
      ["paid", invoiceId]
    );
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const invoiceId = intent.metadata && intent.metadata.invoiceId;

    if (!invoiceId) {
      return res.json({ received: true });
    }

    await pool.query(
      "update payment set status = $1, external_payment_id = $2 where invoice_id = $3",
      ["failed", intent.id, invoiceId]
    );

    await pool.query(
      "update invoice set status = $1 where id = $2",
      ["open", invoiceId]
    );
  }

  return res.json({ received: true });
}
