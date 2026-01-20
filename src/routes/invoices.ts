import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { pool } from "../db";

export const invoicesRouter = Router();

invoicesRouter.get("/", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      "select count(*) as count from invoice where tenant_id = $1",
      [req.auth.tenantId]
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      "select id, subscription_id, number, status, issue_date, due_date, total_cents, currency from invoice where tenant_id = $1 order by issue_date desc limit $2 offset $3",
      [req.auth.tenantId, limit, offset]
    );

    const invoices = result.rows.map(row => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      number: row.number,
      status: row.status,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      totalCents: row.total_cents,
      currency: row.currency
    }));

    return res.json({
      tenantId: req.auth.tenantId,
      total,
      page,
      totalPages,
      invoices
    });
  } catch {
    return res.status(500).json({ error: "Failed to load invoices" });
  }
});

