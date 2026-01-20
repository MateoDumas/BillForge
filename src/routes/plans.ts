import { Router, Request, Response } from "express";
import { pool } from "../db";

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

