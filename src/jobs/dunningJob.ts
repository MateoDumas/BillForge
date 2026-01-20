import { pool } from "../db";
import { SubscriptionStatus } from "../types";
import { emailService } from "../services/emailService";
import { alertService } from "../services/alertService";
import { AuditService } from "../services/auditService";

export async function runDunningJob() {
  console.log(`[DunningJob] Starting dunning process at ${new Date().toISOString()}`);
  
  const client = await pool.connect();
  try {
    // Find past due subscriptions that haven't been emailed in the last 3 days
    // or never emailed
    // We strictly look for PAST_DUE status
    const query = `
      SELECT s.id, s.tenant_id, t.billing_email, t.name as tenant_name,
             i.number as invoice_number, i.total_cents, i.currency
      FROM subscription s
      JOIN tenant t ON s.tenant_id = t.id
      JOIN invoice i ON i.subscription_id = s.id AND i.status = 'open'
      WHERE s.status = $1
      AND (s.last_dunning_sent_at IS NULL OR s.last_dunning_sent_at < NOW() - INTERVAL '3 days')
    `;
    
    const result = await client.query(query, [SubscriptionStatus.PAST_DUE]);
    console.log(`[DunningJob] Found ${result.rows.length} subscriptions needing dunning`);

    for (const row of result.rows) {
      try {
        const amount = (row.total_cents / 100).toFixed(2) + " " + row.currency.toUpperCase();
        
        await emailService.sendDunningEmail(
          row.billing_email,
          row.tenant_name,
          row.invoice_number,
          amount
        );

        await client.query(
          "UPDATE subscription SET last_dunning_sent_at = NOW() WHERE id = $1",
          [row.id]
        );
        
        console.log(`[DunningJob] Sent dunning email to ${row.billing_email} for subscription ${row.id}`);
        await AuditService.log({
          tenantId: row.tenant_id,
          eventType: "dunning.email_sent",
          severity: "warning",
          message: `Dunning email sent to ${row.billing_email}`,
          metadata: { subscriptionId: row.id, invoice: row.invoice_number }
        });
      } catch (err) {
        await alertService.notifyError("DunningJob - Email Send", err as Error, { subscriptionId: row.id });
        await AuditService.logSystem("DunningJob", "error", `Failed to send dunning email`, { subscriptionId: row.id, error: (err as Error).message });
      }
    }

  } catch (error) {
    await alertService.notifyCritical(`DunningJob Failed: ${(error as Error).message}`);
    await AuditService.logSystem("DunningJob", "critical", "Dunning job failed", { error: (error as Error).message });
  } finally {
    client.release();
    console.log(`[DunningJob] Completed at ${new Date().toISOString()}`);
    await AuditService.logSystem("DunningJob", "info", "Completed dunning process");
  }
}
