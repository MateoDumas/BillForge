import "dotenv/config";
import express, { json, raw, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middleware/auth";
import { tenantsRouter } from "./routes/tenants";
import { plansRouter } from "./routes/plans";
import { subscriptionsRouter } from "./routes/subscriptions";
import { stripeWebhookHandler } from "./routes/webhooks";
import { invoicesRouter } from "./routes/invoices";
import { paymentsRouter } from "./routes/payments";
import { notificationsRouter } from "./routes/notifications";
import { authRouter } from "./routes/auth";
import { initDb } from "./db";

const app = express();

// Initialize DB (ensure tables exist)
initDb().then(() => console.log("DB Initialized"));

// Security & Logging Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.post("/webhooks/stripe", raw({ type: "application/json" }), stripeWebhookHandler);

app.use(json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health/db", async (_req, res) => {
  try {
    const result = await import("./db").then(m => m.pool.query("SELECT NOW()"));
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Public Routes
app.use("/api/auth", authRouter);

// Protected Routes
app.use(authMiddleware);
app.use("/tenants", tenantsRouter);
app.use("/plans", plansRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/invoices", invoicesRouter);
app.use("/payments", paymentsRouter);
app.use("/notifications", notificationsRouter);

// Centralized Error Handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`BillForge API escuchando en puerto ${PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log("Cerrando servidor...");
  server.close(() => {
    console.log("Servidor cerrado.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
