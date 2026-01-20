import { pool } from "../db";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function runDailyBillingJob() {
  const client = await pool.connect();

  try {
    const subscriptions = await client.query(
      "select id, tenant_id, plan_id, status, current_period_start, current_period_end from subscription where status = $1 and current_period_end <= current_date",
      ["active"]
    );

    for (const sub of subscriptions.rows) {
      await client.query("begin");

      const invoiceResult = await client.query(
        "insert into invoice (id, tenant_id, subscription_id, number, status, issue_date, due_date, total_cents, currency) values (gen_random_uuid(), $1, $2, to_char(now(), 'YYYYMMDDHH24MISSMS'), $3, current_date, current_date, 0, $4) returning id",
        [sub.tenant_id, sub.id, "open", "EUR"]
      );

      const invoiceId = invoiceResult.rows[0].id;

      const planResult = await client.query(
        "select base_price_cents, currency, name from plan where id = $1",
        [sub.plan_id]
      );

      if (planResult.rows.length === 0) {
        await client.query("rollback");
        continue;
      }

      const plan = planResult.rows[0];

      await client.query(
        "insert into invoice_line (id, invoice_id, description, quantity, unit_price_cents, amount_cents, type) values (gen_random_uuid(), $1, $2, 1, $3, $3, $4)",
        [invoiceId, plan.name, plan.base_price_cents, "recurring"]
      );

      await client.query(
        "update invoice set total_cents = $1, currency = $2 where id = $3",
        [plan.base_price_cents, plan.currency, invoiceId]
      );

      let externalPaymentId: string | null = null;

      if (stripeClient) {
        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: plan.base_price_cents,
          currency: String(plan.currency).toLowerCase(),
          metadata: {
            invoiceId: invoiceId
          }
        });

        externalPaymentId = paymentIntent.id;
      }

      await client.query(
        "insert into payment (id, tenant_id, invoice_id, status, amount_cents, currency, external_payment_id) values (gen_random_uuid(), $1, $2, $3, $4, $5, $6)",
        [sub.tenant_id, invoiceId, "pending", plan.base_price_cents, plan.currency, externalPaymentId]
      );

      await client.query(
        "update subscription set current_period_start = current_date, current_period_end = current_date + interval '30 days' where id = $1",
        [sub.id]
      );

      await client.query("commit");
    }
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}
