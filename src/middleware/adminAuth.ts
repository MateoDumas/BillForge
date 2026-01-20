import { Request, Response, NextFunction } from "express";
import { RequestWithAuth } from "./auth";

export function requireSuperAdmin(
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
) {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if roles array contains 'super_admin'
  if (!req.auth.roles || !req.auth.roles.includes("super_admin")) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  next();
}
