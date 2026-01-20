import "dotenv/config";
import { pool } from "../db";

async function seedSuperAdmin() {
  console.log("Seeding Super Admin...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Ensure pgcrypto
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

    // 2. Create System Tenant
    const systemTenantId = "00000000-0000-0000-0000-000000000000";
    await client.query(`
      INSERT INTO tenant (id, name, billing_email, status)
      VALUES ($1, 'BillForge System', 'system@billforge.io', 'active')
      ON CONFLICT (id) DO NOTHING
    `, [systemTenantId]);

    // 3. Create/Update Admin User
    const email = "admin@billforge.com";
    const password = "admin123";
    
    // We use upsert logic. If exists, we update password.
    // Note: We need to find the ID first if we want to be safe, or use ON CONFLICT on email.
    // Assuming email is UNIQUE in app_user table.

    // First delete if exists to be clean (or update)
    // Let's just update password if exists, or insert if not.
    
    const userRes = await client.query(`
      INSERT INTO app_user (id, tenant_id, email, password_hash, status)
      VALUES (gen_random_uuid(), $1, $2, crypt($3, gen_salt('bf')), 'active')
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = crypt($3, gen_salt('bf'))
      RETURNING id
    `, [systemTenantId, email, password]);

    const userId = userRes.rows[0].id;

    // 4. Assign Role
    // Let's delete old roles for this user first to be safe.
    await client.query("DELETE FROM user_role WHERE user_id = $1", [userId]);
    await client.query(`
      INSERT INTO user_role (id, user_id, tenant_id, role)
      VALUES (gen_random_uuid(), $1, $2, 'super_admin')
    `, [userId, systemTenantId]);

    await client.query("COMMIT");
    console.log(`Super Admin seeded successfully.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed super admin:", error);
  } finally {
    client.release();
    process.exit();
  }
}

seedSuperAdmin();
