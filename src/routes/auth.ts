import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Check user and verify password using pgcrypto
    const result = await pool.query(`
      SELECT u.id, u.tenant_id, u.email, r.role 
      FROM app_user u
      LEFT JOIN user_role r ON u.id = r.user_id
      WHERE u.email = $1 
      AND u.password_hash = crypt($2, u.password_hash)
    `, [email, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Generate Token
    const token = jwt.sign({
      sub: user.id,
      tenantId: user.tenant_id,
      roles: user.role ? [user.role] : []
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { email: user.email, role: user.role } });

  } catch (err: any) {
    console.error("Login error:", err);
    // Return actual error for debugging (remove in production later)
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
