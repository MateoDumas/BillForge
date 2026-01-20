import "dotenv/config";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "change-me-in-production";

const payload = {
  sub: "22222222-2222-2222-2222-222222222222",
  tenantId: "11111111-1111-1111-1111-111111111111",
  roles: ["owner"]
};

const token = jwt.sign(payload, secret, {
  expiresIn: "7d"
});

console.log(token);

