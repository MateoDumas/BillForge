import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { requireSuperAdmin } from "../middleware/adminAuth";
import { pool } from "../db";
import { SubscriptionStatus } from "../types";
import { runDailyBillingJob } from "../jobs/billingJob";
import { runDunningJob } from "../jobs/dunningJob";
import { AuditService } from "../services/auditService";
import { JobService } from "../services/jobService";

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(requireSuperAdmin);

// Helper for active statuses
const activeStatuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.GRACE_PERIOD];

// Global Stats (MRR, Total Tenants, Active Subscriptions)
adminRouter.get("/stats", async (_req: RequestWithAuth, res: Response) => {
  try {
    // 1. Total Tenants
    const tenantsResult = await pool.query("SELECT count(*) as count FROM tenant WHERE status = 'active'");
    const totalTenants = parseInt(tenantsResult.rows[0].count, 10);

    // 2. Active Subscriptions
    const subsResult = await pool.query("SELECT count(*) as count FROM subscription WHERE status = ANY($1)", [activeStatuses]);
    const activeSubscriptions = parseInt(subsResult.rows[0].count, 10);

    // 3. MRR (Monthly Recurring Revenue)
    // Sum of base_price_cents of all active subscriptions
    const mrrResult = await pool.query(`
      SELECT sum(p.base_price_cents) as mrr
      FROM subscription s
      JOIN plan p ON s.plan_id = p.id
      WHERE s.status = ANY($1)
    `, [activeStatuses]);
    const mrrCents = parseInt(mrrResult.rows[0].mrr || '0', 10);

    // 4. Failed Payments (Last 30 days)
    const failedPaymentsResult = await pool.query(`
      SELECT count(*) as count 
      FROM payment 
      WHERE status = 'failed' 
      AND created_at > NOW() - INTERVAL '30 days'
    `);
    const failedPaymentsCount = parseInt(failedPaymentsResult.rows[0].count, 10);

    // 5. ARR (Annual Recurring Revenue) - Approx MRR * 12
    const arrCents = mrrCents * 12;

    // 6. Revenue by Plan
    const revenueByPlanResult = await pool.query(`
      SELECT p.name, sum(p.base_price_cents) as revenue_cents, count(s.id) as sub_count
      FROM subscription s
      JOIN plan p ON s.plan_id = p.id
      WHERE s.status = ANY($1)
      GROUP BY p.name
      ORDER BY revenue_cents DESC
    `, [activeStatuses]);
    
    const revenueByPlan = revenueByPlanResult.rows.map(row => ({
      name: row.name,
      revenueCents: parseInt(row.revenue_cents, 10),
      count: parseInt(row.sub_count, 10)
    }));

    res.json({
      totalTenants,
      activeSubscriptions,
      mrrCents,
      arrCents,
      failedPaymentsCount,
      revenueByPlan,
      currency: "EUR"
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Recent Failed Payments
adminRouter.get("/failures", async (_req: RequestWithAuth, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.amount_cents, 
        p.currency, 
        p.created_at, 
        p.status,
        t.name as tenant_name,
        t.billing_email
      FROM payment p
      JOIN tenant t ON p.tenant_id = t.id
      WHERE p.status = 'failed'
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    const failures = result.rows.map(row => ({
      id: row.id,
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      status: row.status,
      tenantName: row.tenant_name,
      billingEmail: row.billing_email
    }));

    res.json(failures);
  } catch (error) {
    console.error("Error fetching failures:", error);
    res.status(500).json({ error: "Failed to fetch failures" });
  }
});

// List Tenants
adminRouter.get("/tenants", async (_req: RequestWithAuth, res: Response) => {
    try {
      const result = await pool.query(`
      SELECT t.id, t.name, t.billing_email, t.status, t.created_at,
             (SELECT count(*) FROM subscription s WHERE s.tenant_id = t.id AND s.status = ANY($1)) as active_subs
      FROM tenant t
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [activeStatuses]);
  
      const tenants = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.billing_email,
        status: row.status,
        joinedAt: row.created_at,
        activeSubs: parseInt(row.active_subs, 10)
      }));
  
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

// Audit Logs
adminRouter.get("/logs", async (req: RequestWithAuth, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const logs = await AuditService.getLogs(limit, offset);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Trigger Billing Job
adminRouter.post("/jobs/billing", async (_req: RequestWithAuth, res: Response) => {
  try {
    // Run in background
    runDailyBillingJob().catch((err: unknown) => console.error("Manual billing job failed:", err));
    res.json({ message: "Billing job triggered" });
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger billing job" });
  }
});

// Trigger Dunning Job
adminRouter.post("/jobs/dunning", async (_req: RequestWithAuth, res: Response) => {
  try {
    // Run in background
    runDunningJob().catch((err: unknown) => console.error("Manual dunning job failed:", err));
    res.json({ message: "Dunning job triggered" });
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger dunning job" });
  }
});

// List Plans
adminRouter.get("/plans", async (_req: RequestWithAuth, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM plan ORDER BY name ASC");
    const plans = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      billingPeriod: row.billing_period,
      basePriceCents: row.base_price_cents,
      currency: row.currency,
      isUsageBased: row.is_usage_based,
      usageMetric: row.usage_metric
    }));
    res.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create Plan
adminRouter.post("/plans", async (req: RequestWithAuth, res: Response) => {
  try {
    const { code, name, billing_period, base_price_cents, currency, is_usage_based, usage_metric } = req.body;
    
    // Basic validation
    if (!code || !name || !billing_period || base_price_cents === undefined || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO plan (code, name, billing_period, base_price_cents, currency, is_usage_based, usage_metric)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [code, name, billing_period, base_price_cents, currency, is_usage_based || false, usage_metric || null]
    );

    await AuditService.log({
      tenantId: "system", 
      eventType: "plan.created",
      severity: "info",
      message: `Plan created: ${name} (${code})`,
      metadata: { planId: result.rows[0].id }
    });

    const newPlan = result.rows[0];
    res.json({
      id: newPlan.id,
      code: newPlan.code,
      name: newPlan.name,
      billingPeriod: newPlan.billing_period,
      basePriceCents: newPlan.base_price_cents,
      currency: newPlan.currency,
      isUsageBased: newPlan.is_usage_based,
      usageMetric: newPlan.usage_metric
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Job History
adminRouter.get("/jobs", async (req: RequestWithAuth, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const jobs = await JobService.getJobHistory(limit, offset);
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching job history:", error);
    res.status(500).json({ error: "Failed to fetch job history" });
  }
});

export { adminRouter as default };
