import { pool } from "../db";
import Stripe from "stripe";
import { SubscriptionStatus } from "../types";
import { alertService } from "../services/alertService";
import { AuditService } from "../services/auditService";
import { JobService } from "../services/jobService";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function runDailyBillingJob() {
  const jobId = await JobService.startJob("DailyBilling", { startTime: new Date().toISOString() });
  console.log(`[BillingJob] Starting daily billing job (ID: ${jobId}) at ${new Date().toISOString()}`);
  
  const client = await pool.connect();
  const stats = { total: 0, processed: 0, failed: 0 };

  try {
    const subscriptions = await client.query(
      "select id, tenant_id, plan_id, status, current_period_start, current_period_end from subscription where status = ANY($1) and current_period_end <= current_date",
      [[SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.GRACE_PERIOD]]
    );

    stats.total = subscriptions.rows.length;
    await JobService.updateJob(jobId, { status: "processing_subscriptions", stats });

    console.log(`[BillingJob] Found ${subscriptions.rows.length} subscriptions to process`);

    for (const sub of subscriptions.rows) {
      try {
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
          await alertService.notifyError("BillingJob - Plan Lookup", `Plan not found for subscription ${sub.id}`);
          await client.query("rollback");
          stats.failed++;
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
          try {
            const paymentIntent = await stripeClient.paymentIntents.create({
              amount: plan.base_price_cents,
              currency: String(plan.currency).toLowerCase(),
              metadata: {
                invoiceId: invoiceId
              }
            });
            externalPaymentId = paymentIntent.id;
          } catch (stripeError) {
             console.error(`[BillingJob] Stripe error for subscription ${sub.id}:`, stripeError);
             // We continue to record the invoice even if Stripe fails creation (it will be failed payment later)
          }
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
        stats.processed++;
        console.log(`[BillingJob] Processed subscription ${sub.id} successfully. Invoice: ${invoiceId}`);
      } catch (innerError) {
        await client.query("rollback");
        stats.failed++;
        await alertService.notifyError("BillingJob - Subscription Processing", innerError as Error, { subscriptionId: sub.id });
        await AuditService.logSystem("BillingJob", "error", `Error processing subscription ${sub.id}`, { error: (innerError as Error).message });
      }
    }

    await JobService.completeJob(jobId, { stats, endTime: new Date().toISOString() });
  } catch (error) {
    await JobService.failJob(jobId, error as Error, { stats });
    await alertService.notifyCritical(`BillingJob Fatal Error: ${(error as Error).message}`);
    await AuditService.logSystem("BillingJob", "critical", `Fatal error in billing job`, { error: (error as Error).message });
    throw error;
  } finally {
    client.release();
    console.log(`[BillingJob] Completed at ${new Date().toISOString()}`);
    await AuditService.logSystem("BillingJob", "info", "Completed daily billing job");
  }
}
