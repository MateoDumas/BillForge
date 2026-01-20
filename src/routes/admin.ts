import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { requireSuperAdmin } from "../middleware/adminAuth";
import { pool } from "../db";

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(requireSuperAdmin);

// Global Stats (MRR, Total Tenants, Active Subscriptions)
adminRouter.get("/stats", async (_req: RequestWithAuth, res: Response) => {
  try {
    // 1. Total Tenants
    const tenantsResult = await pool.query("SELECT count(*) as count FROM tenant WHERE status = 'active'");
    const totalTenants = parseInt(tenantsResult.rows[0].count, 10);

    // 2. Active Subscriptions
    const subsResult = await pool.query("SELECT count(*) as count FROM subscription WHERE status = 'active'");
    const activeSubscriptions = parseInt(subsResult.rows[0].count, 10);

    // 3. MRR (Monthly Recurring Revenue)
    // Sum of base_price_cents of all active subscriptions
    const mrrResult = await pool.query(`
      SELECT sum(p.base_price_cents) as mrr
      FROM subscription s
      JOIN plan p ON s.plan_id = p.id
      WHERE s.status = 'active'
    `);
    const mrrCents = parseInt(mrrResult.rows[0].mrr || '0', 10);

    // 4. Failed Payments (Last 30 days)
    const failedPaymentsResult = await pool.query(`
      SELECT count(*) as count 
      FROM payment 
      WHERE status = 'failed' 
      AND created_at > NOW() - INTERVAL '30 days'
    `);
    const failedPaymentsCount = parseInt(failedPaymentsResult.rows[0].count, 10);

    res.json({
      totalTenants,
      activeSubscriptions,
      mrrCents,
      failedPaymentsCount,
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
               (SELECT count(*) FROM subscription s WHERE s.tenant_id = t.id AND s.status = 'active') as active_subs
        FROM tenant t
        ORDER BY t.created_at DESC
        LIMIT 50
      `);
  
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
