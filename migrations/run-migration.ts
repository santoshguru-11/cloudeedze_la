import 'dotenv/config';
import { pool } from "../server/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("🚀 Starting database migration...");

    // Read the migration file
    const migrationPath = path.join(__dirname, "001_add_admin_and_reports.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📄 Migration file loaded:", migrationPath);

    // Execute the migration
    await pool.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   - Added 'role' column to users table");
    console.log("   - Added 'status' and 'error_message' columns to inventory_scans table");
    console.log("   - Created 'scan_reports' table");
    console.log("   - Created 6 new indexes for performance");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
