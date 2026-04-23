import { drizzle } from "drizzle-orm/mysql2";
import { products, users } from "./drizzle/schema.ts";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const seedProducts = [
  {
    name: "Sambal Bawang",
    slug: "sambal-bawang",
    description: "Sambal bawang dengan cita rasa kaya dan aroma yang menggugah selera. Dibuat dari bawang merah pilihan dan cabai segar.",
    price: 25000,
    stock: 50,
    spiceLevel: 2,
    imageUrl: "/manus-storage/sambal-bawang.jpg",
    isActive: true,
  },
  {
    name: "Sambal Teri Medan",
    slug: "sambal-teri-medan",
    description: "Sambal teri dengan tekstur yang sempurna dan rasa yang kompleks. Menggunakan teri pilihan dari Medan.",
    price: 30000,
    stock: 35,
    spiceLevel: 3,
    imageUrl: "/manus-storage/sambal-teri-medan.jpg",
    isActive: true,
  },
  {
    name: "Sambal Cabe Ijo",
    slug: "sambal-cabe-ijo",
    description: "Sambal cabe hijau yang segar dengan rasa pedas yang seimbang. Sempurna untuk menemani nasi putih.",
    price: 25000,
    stock: 40,
    spiceLevel: 2,
    imageUrl: "/manus-storage/sambal-cabe-ijo.jpg",
    isActive: true,
  },
  {
    name: "Sambal Level 10",
    slug: "sambal-level-10",
    description: "Untuk yang berani! Sambal paling pedas dengan rasa yang intens. Hanya untuk pecinta sambal sejati.",
    price: 28000,
    stock: 20,
    spiceLevel: 5,
    imageUrl: "/manus-storage/sambal-level-10.jpg",
    isActive: true,
  },
];

async function seed() {
  try {
    console.log("🌱 Starting seed...");
    
    // Check if products already exist
    const existingProducts = await db.select().from(products).limit(1);
    
    if (existingProducts.length === 0) {
      // Insert products
      for (const product of seedProducts) {
        await db.insert(products).values(product);
        console.log(`✅ Seeded product: ${product.name}`);
      }
    } else {
      console.log("✅ Products already exist. Skipping product seed.");
    }

    // Check if test users already exist
    const existingUsers = await db.select().from(users).limit(2);
    
    if (existingUsers.length === 0) {
      // Create test user
      const testUserPassword = await bcryptjs.hash("testing123", 10);
      await db.insert(users).values({
        email: "test@example.com",
        name: "Test User",
        passwordHash: testUserPassword,
        role: "user",
        loginMethod: "database",
        openId: "db_test@example.com",
        phone: "+62812345678",
        lastSignedIn: new Date(),
      });
      console.log(`✅ Created test user: test@example.com (password: testing123)`);

      // Create admin user
      const adminUserPassword = await bcryptjs.hash("kepobanget123@", 10);
      await db.insert(users).values({
        email: "indonesiariyan@Gmail.com",
        name: "Admin User",
        passwordHash: adminUserPassword,
        role: "admin",
        loginMethod: "database",
        openId: "db_indonesiariyan@Gmail.com",
        phone: "+62812345679",
        lastSignedIn: new Date(),
      });
      console.log(`✅ Created admin user: indonesiariyan@Gmail.com (password: kepobanget123@)`);
    } else {
      console.log("✅ Users already exist. Skipping user seed.");
    }

    console.log("🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
