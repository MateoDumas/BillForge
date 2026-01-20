import { Router, Request, Response } from "express";
import { pool } from "../db";
import { requireSuperAdmin } from "../middleware/adminAuth";
import { RequestWithAuth } from "../middleware/auth";

export const plansRouter = Router();

plansRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM plan ORDER BY base_price_cents ASC");
    const plans = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      billingPeriod: row.billing_period,
      basePriceCents: row.base_price_cents,
      currency: row.currency
    }));
    res.json(plans);
  } catch (error) {
    console.error("Error loading plans:", error);
    res.status(500).json({ error: "Failed to load plans" });
  }
});

// Create Plan (Super Admin only)
plansRouter.post("/", requireSuperAdmin, async (req: RequestWithAuth, res: Response) => {
  try {
    const { code, name, billingPeriod, basePriceCents, currency } = req.body;
    
    // Basic validation
    if (!code || !name || !basePriceCents || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO plan (id, code, name, billing_period, base_price_cents, currency, is_usage_based)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, false)
       RETURNING id`,
      [code, name, billingPeriod || 'monthly', basePriceCents, currency]
    );

    res.status(201).json({ id: result.rows[0].id, message: "Plan created successfully" });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Update Plan (Super Admin only)
plansRouter.put("/:id", requireSuperAdmin, async (req: RequestWithAuth, res: Response) => {
  try {
    const { id } = req.params;
    const { name, basePriceCents } = req.body; // Only allow updating name and price for now to avoid breaking subs

    if (!name && basePriceCents === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (basePriceCents !== undefined) {
      updates.push(`base_price_cents = $${paramIndex++}`);
      values.push(basePriceCents);
    }

    values.push(id);

    await pool.query(
      `UPDATE plan SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ message: "Plan updated successfully" });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

