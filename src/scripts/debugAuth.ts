import "dotenv/config";
import { pool } from "../db";

async function debugAuth() {
  console.log("Debugging Auth...");
  const client = await pool.connect();
  const email = "admin@billforge.com";
  const password = "admin123";

  try {
    // 1. Check if user exists (ignoring password)
    console.log(`Checking for user: ${email}`);
    const userRes = await client.query("SELECT id, email, password_hash FROM app_user WHERE email = $1", [email]);
    
    if (userRes.rows.length === 0) {
      console.log("❌ User NOT FOUND in database.");
    } else {
      console.log("✅ User FOUND in database.");
      console.log("ID:", userRes.rows[0].id);
      console.log("Hash start:", userRes.rows[0].password_hash.substring(0, 10) + "...");

      // 2. Check password verification manually
      console.log("Verifying password...");
      const verifyRes = await client.query(`
        SELECT (password_hash = crypt($1, password_hash)) as is_valid
        FROM app_user
        WHERE email = $2
      `, [password, email]);
      
      if (verifyRes.rows[0].is_valid) {
        console.log("✅ Password verification SUCCEEDED via SQL.");
      } else {
        console.log("❌ Password verification FAILED via SQL.");
      }
    }

    // 3. Check roles
    if (userRes.rows.length > 0) {
      const roleRes = await client.query("SELECT * FROM user_role WHERE user_id = $1", [userRes.rows[0].id]);
      console.log("Roles found:", roleRes.rows);
    }

  } catch (error) {
    console.error("Debug failed:", error);
  } finally {
    client.release();
    process.exit();
  }
}

debugAuth();
