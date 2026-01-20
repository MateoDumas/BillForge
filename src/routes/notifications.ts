import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { pool } from "../db";

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      "select id, type, message, read, created_at from notification where tenant_id = $1 order by created_at desc limit 20",
      [req.auth.tenantId]
    );

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      read: row.read,
      createdAt: row.created_at
    }));

    return res.json({
      notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Failed to load notifications" });
  }
});

notificationsRouter.post("/:id/read", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await pool.query(
      "update notification set read = true where id = $1 and tenant_id = $2",
      [req.params.id, req.auth.tenantId]
    );

    return res.json({ status: "success" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

notificationsRouter.post("/read-all", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await pool.query(
      "update notification set read = true where tenant_id = $1",
      [req.auth.tenantId]
    );

    return res.json({ status: "success" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});
