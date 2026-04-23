import { drizzle } from "drizzle-orm/mysql2";
import { users } from "./drizzle/schema.ts";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log("🔍 Checking database...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    console.log(`\n📊 Total users in database: ${allUsers.length}\n`);
    
    if (allUsers.length > 0) {
      console.log("Users found:");
      for (const user of allUsers) {
        console.log(`  - Email: ${user.email}, Role: ${user.role}, Password Hash: ${user.passwordHash ? "✅" : "❌"}`);
      }
    } else {
      console.log("⚠️  No users found in database!");
    }

    // Check for the admin user
    const adminUser = await db.select().from(users).where(
      (u) => u.email === "indonesiariyan@Gmail.com"
    );

    if (adminUser.length > 0) {
      console.log("\n✅ Admin user found!");
      const admin = adminUser[0];
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Has password: ${admin.passwordHash ? "✅" : "❌"}`);
      
      // Test password
      if (admin.passwordHash) {
        const isValid = await bcryptjs.compare("kepobanget123@", admin.passwordHash);
        console.log(`   Password "kepobanget123@" matches: ${isValid ? "✅" : "❌"}`);
      }
    } else {
      console.log("\n❌ Admin user NOT found!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkDatabase();
