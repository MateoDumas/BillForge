import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { pool } from "../db";

export const paymentsRouter = Router();

paymentsRouter.get("/", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      "select count(*) as count from payment where tenant_id = $1",
      [req.auth.tenantId]
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      "select id, invoice_id, status, amount_cents, currency, external_payment_id, created_at from payment where tenant_id = $1 order by created_at desc limit $2 offset $3",
      [req.auth.tenantId, limit, offset]
    );

    const payments = result.rows.map(row => ({
      id: row.id,
      invoiceId: row.invoice_id,
      status: row.status,
      amountCents: row.amount_cents,
      currency: row.currency,
      externalPaymentId: row.external_payment_id,
      createdAt: row.created_at
    }));

    return res.json({
      tenantId: req.auth.tenantId,
      total,
      page,
      totalPages,
      payments
    });
  } catch {
    return res.status(500).json({ error: "Failed to load payments" });
  }
});

paymentsRouter.post("/:id/retry", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const paymentId = req.params.id;

  try {
    // 1. Check if payment exists and belongs to tenant
    const paymentResult = await pool.query(
      "select * from payment where id = $1 and tenant_id = $2",
      [paymentId, req.auth.tenantId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentResult.rows[0];

    if (payment.status === 'succeeded') {
      return res.status(400).json({ error: "Payment already succeeded" });
    }

    // 2. Simulate retry (success)
    const newStatus = 'succeeded';
    
    // Update payment status
    await pool.query(
      "update payment set status = $1 where id = $2",
      [newStatus, paymentId]
    );

    // 3. Update invoice status if payment succeeded
    if (newStatus === 'succeeded') {
      await pool.query(
        "update invoice set status = 'paid' where id = $1",
        [payment.invoice_id]
      );

      // Create notification
      await pool.query(
        "insert into notification (tenant_id, type, message) values ($1, 'success', $2)",
        [req.auth.tenantId, `Pago reintentado con éxito para la factura ${payment.invoice_id}`]
      );
    }

    return res.json({
      status: 'success',
      message: 'Payment retried successfully',
      payment: {
        ...payment,
        status: newStatus
      }
    });

  } catch (error) {
    console.error("Retry payment error:", error);
    return res.status(500).json({ error: "Failed to retry payment" });
  }
});

