import { Router, Response } from "express";
import { RequestWithAuth } from "../middleware/auth";
import { pool } from "../db";
import crypto from "crypto";

export const profileRouter = Router();

// GET /api/profile/me
profileRouter.get("/me", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, tenantId } = req.auth;

  try {
    // 1. Get User & Tenant Info
    const userResult = await pool.query(`
      SELECT u.email, u.created_at, r.role, t.name as tenant_name, t.api_key
      FROM app_user u
      JOIN tenant t ON u.tenant_id = t.id
      LEFT JOIN user_role r ON u.id = r.user_id
      WHERE u.id = $1 AND t.id = $2
    `, [userId, tenantId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User or Tenant not found" });
    }

    const user = userResult.rows[0];

    // 2. Get Active Subscription Info
    const subResult = await pool.query(`
      SELECT s.status, p.name as plan_name, s.current_period_end
      FROM subscription s
      JOIN plan p ON s.plan_id = p.id
      WHERE s.tenant_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [tenantId]);

    const subscription = subResult.rows.length > 0 ? subResult.rows[0] : null;

    res.json({
      user: {
        id: userId,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      tenant: {
        id: tenantId,
        name: user.tenant_name,
        apiKey: user.api_key
      },
      subscription: subscription ? {
        planName: subscription.plan_name,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      } : null
    });

  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/profile/api-key
// Regenerate API Key
profileRouter.post("/api-key", async (req: RequestWithAuth, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Only owner or super_admin should be able to rotate keys?
  // For now, let's allow any authenticated user of the tenant for simplicity, 
  // or restrict to 'owner' role if possible.
  
  // Basic check if user has 'owner' role
  if (!req.auth.roles?.includes('owner') && !req.auth.roles?.includes('super_admin')) {
     return res.status(403).json({ error: "Only owners can manage API keys" });
  }

  const { tenantId } = req.auth;
  const newKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

  try {
    await pool.query(`
      UPDATE tenant 
      SET api_key = $1
      WHERE id = $2
    `, [newKey, tenantId]);

    res.json({ apiKey: newKey });
  } catch (err) {
    console.error("Error generating API key:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
