import { Router, Response, NextFunction } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { pool } from "../db";

export const tenantsRouter = Router();

tenantsRouter.get(
  "/me",
  (req: RequestWithAuth, res: Response, _next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.json({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      roles: req.auth.roles
    });
  }
);

tenantsRouter.get(
  "/stats",
  async (req: RequestWithAuth, res: Response, _next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const tenantId = req.auth.tenantId;

      // 1. Total gastado (pagos exitosos)
      const totalSpentResult = await pool.query(
        "select coalesce(sum(amount_cents), 0) as total from payment where tenant_id = $1 and status = 'succeeded'",
        [tenantId]
      );
      const totalSpentCents = parseInt(totalSpentResult.rows[0].total, 10);

      // 2. Facturas pendientes (conteo y monto)
      const pendingInvoicesResult = await pool.query(
        "select count(*) as count, coalesce(sum(total_cents), 0) as total from invoice where tenant_id = $1 and status in ('open', 'past_due')",
        [tenantId]
      );
      const pendingInvoicesCount = parseInt(pendingInvoicesResult.rows[0].count, 10);
      const pendingInvoicesAmountCents = parseInt(pendingInvoicesResult.rows[0].total, 10);

      // 3. Suscripción activa y próxima fecha
      const subscriptionResult = await pool.query(
        "select current_period_end, plan_id from subscription where tenant_id = $1 and status = 'active' limit 1",
        [tenantId]
      );
      
      let nextBillingDate: string | null = null;
      let nextBillingAmountCents: number | null = null;

      if (subscriptionResult.rows.length > 0) {
        nextBillingDate = subscriptionResult.rows[0].current_period_end;
        const planId = subscriptionResult.rows[0].plan_id;
        
        const planResult = await pool.query(
          "select base_price_cents from plan where id = $1",
          [planId]
        );
        if (planResult.rows.length > 0) {
          nextBillingAmountCents = planResult.rows[0].base_price_cents;
        }
      }

      return res.json({
        totalSpentCents,
        pendingInvoicesCount,
        pendingInvoicesAmountCents,
        nextBillingDate,
        nextBillingAmountCents,
        currency: "EUR" // Asumimos EUR por ahora para simplificar
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);
