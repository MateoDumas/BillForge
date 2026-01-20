import "dotenv/config";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "change-me-in-production";

// Use the hardcoded system tenant ID for super admin if exists, or just a placeholder
// In real app, we might check DB, but for JWT validation, as long as role is super_admin
const payload = {
  sub: "00000000-0000-0000-0000-000000000000", // System User ID
  tenantId: "00000000-0000-0000-0000-000000000000", // System Tenant ID
  roles: ["super_admin"]
};

const token = jwt.sign(payload, secret, {
  expiresIn: "7d"
});

console.log("SUPER_ADMIN Token:");
console.log(token);
