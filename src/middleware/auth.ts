import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

interface JwtPayload {
  sub: string;
  tenantId: string;
  roles?: string[];
}

export interface RequestWithAuth extends Request {
  auth?: AuthUser;
}

export function authMiddleware(
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const header = req.headers["authorization"];
  
  if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

  const token = header.substring("Bearer ".length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.tenantId || !decoded.sub) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const roles = decoded.roles && decoded.roles.length > 0 ? decoded.roles : ["member"];

    req.auth = {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      roles
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

