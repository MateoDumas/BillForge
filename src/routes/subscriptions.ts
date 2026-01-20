import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { pool } from "../db";
import { validate } from "../middleware/validation";
import { cancelSubscriptionSchema, createSubscriptionSchema } from "../schemas";

export const subscriptionsRouter = Router();

subscriptionsRouter.get("/", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      "select id, plan_id, status, start_date, current_period_start, current_period_end from subscription where tenant_id = $1 order by current_period_start desc limit 1",
      [req.auth.tenantId]
    );

    if (result.rows.length === 0) {
      return res.json({
        tenantId: req.auth.tenantId,
        subscription: null
      });
    }

    const row = result.rows[0];

    // Create notification
    await pool.query(
      "insert into notification (tenant_id, type, message) values ($1, 'success', $2)",
      [req.auth.tenantId, `Suscripción creada exitosamente`]
    );

    return res.json({
      tenantId: req.auth.tenantId,
      subscription: {
        id: row.id,
        planId: row.plan_id,
        status: row.status,
        startDate: row.start_date,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load subscription" });
  }
});

subscriptionsRouter.post("/", validate(createSubscriptionSchema), async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { planId } = req.body as { planId?: string };

  if (!planId) {
    return res.status(400).json({ error: "Missing planId" });
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    await client.query(
      "update subscription set status = $1, cancel_at_period_end = true where tenant_id = $2 and status = $3",
      ["canceled", req.auth.tenantId, "active"]
    );

    const insertResult = await client.query(
      "insert into subscription (id, tenant_id, plan_id, status, start_date, current_period_start, current_period_end, cancel_at_period_end) values (gen_random_uuid(), $1, $2, $3, current_date, current_date, current_date + interval '30 days', false) returning id, status, start_date, current_period_start, current_period_end",
      [req.auth.tenantId, planId, "active"]
    );

    const row = insertResult.rows[0];

    await client.query("commit");

    return res.status(201).json({
      tenantId: req.auth.tenantId,
      subscription: {
        id: row.id,
        planId: planId,
        status: row.status,
        startDate: row.start_date,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end
      }
    });
  } catch {
    await client.query("rollback");
    return res.status(500).json({ error: "Failed to create subscription" });
  } finally {
    client.release();
  }
});

subscriptionsRouter.delete("/:id", validate(cancelSubscriptionSchema), async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const subscriptionId = req.params.id;

  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing subscription id" });
  }

  try {
    const result = await pool.query(
      "update subscription set status = $1, cancel_at_period_end = true where id = $2 and tenant_id = $3 returning id, status, cancel_at_period_end",
      ["canceled", subscriptionId, req.auth.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const row = result.rows[0];

    // Create notification
    await pool.query(
      "insert into notification (tenant_id, type, message) values ($1, 'warning', $2)",
      [req.auth.tenantId, `Suscripción cancelada`]
    );

    return res.json({
      tenantId: req.auth.tenantId,
      subscription: {
        id: row.id,
        status: row.status,
        cancelAtPeriodEnd: row.cancel_at_period_end
      }
    });
  } catch {
    return res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

