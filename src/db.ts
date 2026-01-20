import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({
  connectionString
});

// Initialize DB schema if needed
export async function initDb() {
  const client = await pool.connect();
  try {
    console.log("Initializing database...");
    
    // Enable pgcrypto
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        billing_email TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_user (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_role (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES app_user(id),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        role TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        billing_period TEXT NOT NULL,
        base_price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        is_usage_based BOOLEAN NOT NULL DEFAULT FALSE,
        usage_metric TEXT
      );

      CREATE TABLE IF NOT EXISTS subscription (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        plan_id UUID NOT NULL REFERENCES plan(id),
        status TEXT NOT NULL,
        start_date DATE NOT NULL,
        current_period_start DATE NOT NULL,
        current_period_end DATE NOT NULL,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
        external_customer_id TEXT,
        external_subscription_id TEXT,
        last_dunning_sent_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS invoice (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        subscription_id UUID REFERENCES subscription(id),
        number TEXT NOT NULL,
        status TEXT NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        total_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        external_invoice_id TEXT,
        UNIQUE (tenant_id, number)
      );

      CREATE TABLE IF NOT EXISTS invoice_line (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES invoice(id),
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        type TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        invoice_id UUID NOT NULL REFERENCES invoice(id),
        status TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        external_payment_id TEXT,
        error_code TEXT,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_record (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        subscription_id UUID NOT NULL REFERENCES subscription(id),
        metric TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        invoiced BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenant(id),
        user_id UUID NOT NULL REFERENCES app_user(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notification (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL, -- 'info', 'success', 'warning', 'error'
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenant(id), -- Nullable for system events
        user_id UUID REFERENCES app_user(id), -- Nullable for system events
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL, -- info, warning, error, critical
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed data if empty (check if tenant exists)
    const tenantCheck = await client.query('SELECT count(*) FROM tenant');
    if (parseInt(tenantCheck.rows[0].count) === 0) {
      console.log("Seeding demo data...");
      await client.query(`
        INSERT INTO tenant (id, name, billing_email, status)
        VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Tenant', 'demo@example.com', 'active');

        INSERT INTO app_user (id, tenant_id, email, password_hash, status)
        VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'owner@example.com', crypt('admin123', gen_salt('bf')), 'active');

        INSERT INTO user_role (id, user_id, tenant_id, role)
        VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'owner');

        INSERT INTO plan (id, code, name, billing_period, base_price_cents, currency, is_usage_based)
        VALUES 
        ('44444444-4444-4444-4444-444444444444', 'standard', 'Standard', 'monthly', 2900, 'EUR', false),
        ('55555555-5555-5555-5555-555555555555', 'premium', 'Premium', 'monthly', 5900, 'EUR', false);

        INSERT INTO subscription (id, tenant_id, plan_id, status, start_date, current_period_start, current_period_end)
        VALUES ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'active', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days');
        
        -- Seed Super Admin User (admin@billforge.com / admin123)
        INSERT INTO tenant (id, name, billing_email, status)
        VALUES ('77777777-7777-7777-7777-777777777777', 'System Admin', 'admin@billforge.com', 'active');

        INSERT INTO app_user (id, tenant_id, email, password_hash, status)
        VALUES ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'admin@billforge.com', crypt('admin123', gen_salt('bf')), 'active');

        INSERT INTO user_role (id, user_id, tenant_id, role)
        VALUES ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'super_admin');
      `);
      console.log("Demo data seeded.");
    } else {
        // Fix existing demo user password if needed (for users who already deployed with 'demo-hash')
        await client.query(`
            UPDATE app_user 
            SET password_hash = crypt('admin123', gen_salt('bf')) 
            WHERE email = 'owner@example.com' AND password_hash = 'demo-hash'
        `);
    }

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing DB:", err);
  } finally {
    client.release();
  }
}
