import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products, users } from "./drizzle/schema.ts";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const seedProducts = [
  {
    name: "Sambal Bawang",
    slug: "sambal-bawang",
    description:
      "Sambal bawang dengan cita rasa kaya dan aroma yang menggugah selera. Dibuat dari bawang merah pilihan dan cabai segar.",
    price: 25000,
    stock: 50,
    spiceLevel: 2,
    imageUrl: "/manus-storage/sambal-bawang.jpg",
    isActive: true,
  },
  {
    name: "Sambal Teri Medan",
    slug: "sambal-teri-medan",
    description:
      "Sambal teri dengan tekstur yang sempurna dan rasa yang kompleks. Menggunakan teri pilihan dari Medan.",
    price: 30000,
    stock: 35,
    spiceLevel: 3,
    imageUrl: "/manus-storage/sambal-teri-medan.jpg",
    isActive: true,
  },
  {
    name: "Sambal Cabe Ijo",
    slug: "sambal-cabe-ijo",
    description:
      "Sambal cabe hijau yang segar dengan rasa pedas yang seimbang. Sempurna untuk menemani nasi putih.",
    price: 25000,
    stock: 40,
    spiceLevel: 2,
    imageUrl: "/manus-storage/sambal-cabe-ijo.jpg",
    isActive: true,
  },
  {
    name: "Sambal Level 10",
    slug: "sambal-level-10",
    description:
      "Untuk yang berani! Sambal paling pedas dengan rasa yang intens. Hanya untuk pecinta sambal sejati.",
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
      console.log(
        `✅ Created test user: test@example.com (password: testing123)`
      );

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
      console.log(
        `✅ Created admin user: indonesiariyan@Gmail.com (password: kepobanget123@)`
      );
    } else {
      console.log("✅ Users already exist. Skipping user seed.");
    }

    // Check and seed siteSettings
    const { siteSettings } = await import("./drizzle/schema.ts");
    const existingSettings = await db.select().from(siteSettings).limit(1);

    if (existingSettings.length === 0) {
      const defaultSettings = [
        {
          key: "hero_content",
          value: JSON.stringify({
            badge: "Sambal Artisanal Terbaik 2024",
            title: 'RASAKAN <br /><span class="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">KEPEDASAN <br /></span>HAKIKI.',
            description: "Kombinasi sempurna antara cabai segar pilihan dan rempah rahasia. Homemade, tanpa pengawet, dan 100% Halal.",
            imageUrl: "/attached_assets/hero.png"
          })
        },
        {
          key: "system_settings",
          value: JSON.stringify({
            midtransSimulation: true,
            packingFee: 3000,
            freeShippingThreshold: 500000
          })
        },
        {
          key: "how_to_order",
          value: JSON.stringify([
            {
              number: 1,
              title: "Pilih Varian & Jumlah",
              description: "Pilih varian sambal favorit Anda dan tentukan jumlah yang diinginkan dari berbagai pilihan yang tersedia.",
              icon: "ShoppingCart"
            },
            {
              number: 2,
              title: "Checkout & Isi Data",
              description: "Lanjutkan ke checkout, isi data diri lengkap, pilih kurir pengiriman, dan metode pembayaran yang Anda inginkan.",
              icon: "CreditCard"
            },
            {
              number: 3,
              title: "Pembayaran & Pengiriman",
              description: "Transfer pembayaran ke rekening toko atau scan QRIS. Pesanan Anda akan masuk ke WhatsApp kami untuk diproses.",
              icon: "Truck"
            }
          ])
        },
        {
          key: "faq_content",
          value: JSON.stringify([
            { id: 1, question: "Berapa lama sambal dapat bertahan?", answer: "Sambal premium kami dapat bertahan hingga 3 bulan jika disimpan di tempat yang sejuk dan kering. Setelah dibuka, lebih baik disimpan di kulkas dan habiskan dalam 1 bulan untuk hasil terbaik." },
            { id: 2, question: "Apakah sambal ini mengandung pengawet?", answer: "Tidak! Semua produk kami 100% bahan alami tanpa pengawet buatan. Kami hanya menggunakan bahan-bahan segar pilihan dan proses tradisional yang aman." },
            { id: 3, question: "Bagaimana cara pengiriman?", answer: "Kami bekerja sama dengan 3 kurir terpercaya: JNE, SiCepat, dan J&T. Anda bisa memilih kurir favorit saat checkout. Pengiriman biasanya 1-3 hari kerja tergantung lokasi." },
            { id: 4, question: "Apakah produk halal?", answer: "Ya, semua produk kami telah tersertifikasi halal. Kami sangat memperhatikan setiap aspek produksi untuk memastikan kehalalan produk." },
            { id: 5, question: "Apa metode pembayaran yang tersedia?", answer: "Kami menerima transfer bank (BCA, Mandiri, BNI) dan pembayaran via QRIS. Semua metode pembayaran aman dan terpercaya." },
            { id: 6, question: "Bagaimana jika produk rusak saat pengiriman?", answer: "Jika produk rusak atau tidak sesuai, hubungi kami melalui WhatsApp dengan foto bukti. Kami akan mengganti produk Anda tanpa biaya tambahan." }
          ])
        },
        {
          key: "contact_info",
          value: JSON.stringify({
            whatsapp: "6281234567890",
            email: "info@sambalpremium.com",
            address: "Jl. Sambal No. 1, Jakarta Selatan",
            instagram: "sambalpremium",
            facebook: "sambalpremium",
            tiktok: "sambalpremium"
          })
        },
        {
          key: "testimonials_content",
          value: JSON.stringify([
            { id: 1, name: "Budi Santoso", role: "Pecinta Masakan Pedas", comment: "Sambal ini benar-benar luar biasa! Rasa yang sempurna, tidak terlalu pedas tapi cukup menggigit. Saya sudah order berkali-kali.", rating: 5, avatar: "👨" },
            { id: 2, name: "Siti Nurhaliza", role: "Chef Rumahan", comment: "Kualitas bahan-bahannya terlihat jelas. Saya gunakan untuk memasak dan hasilnya sangat memuaskan. Rekomendasi untuk semua!", rating: 5, avatar: "👩" },
            { id: 3, name: "Ahmad Wijaya", role: "Pengusaha Kuliner", comment: "Sebagai pemilik restoran, saya mencari supplier sambal berkualitas. Ini dia! Konsisten dan enak. Pelanggan saya juga suka.", rating: 5, avatar: "👨" }
          ])
        }
      ];

      for (const setting of defaultSettings) {
        const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, setting.key)).limit(1);
        if (existing.length === 0) {
          await db.insert(siteSettings).values(setting);
          console.log(`✅ Seeded setting: ${setting.key}`);
        } else {
          console.log(`ℹ️ Setting ${setting.key} already exists. Skipping.`);
        }
      }
    } else {
      // Even if siteSettings exist, check if the NEW keys are missing
      const defaultSettings = [
        {
          key: "how_to_order",
          value: JSON.stringify([
            {
              number: 1,
              title: "Pilih Varian & Jumlah",
              description: "Pilih varian sambal favorit Anda dan tentukan jumlah yang diinginkan dari berbagai pilihan yang tersedia.",
              icon: "ShoppingCart"
            },
            {
              number: 2,
              title: "Checkout & Isi Data",
              description: "Lanjutkan ke checkout, isi data diri lengkap, pilih kurir pengiriman, dan metode pembayaran yang Anda inginkan.",
              icon: "CreditCard"
            },
            {
              number: 3,
              title: "Pembayaran & Pengiriman",
              description: "Transfer pembayaran ke rekening toko atau scan QRIS. Pesanan Anda akan masuk ke WhatsApp kami untuk diproses.",
              icon: "Truck"
            }
          ])
        },
        {
          key: "faq_content",
          value: JSON.stringify([
            { id: 1, question: "Berapa lama sambal dapat bertahan?", answer: "Sambal premium kami dapat bertahan hingga 3 bulan jika disimpan di tempat yang sejuk dan kering. Setelah dibuka, lebih baik disimpan di kulkas dan habiskan dalam 1 bulan untuk hasil terbaik." },
            { id: 2, question: "Apakah sambal ini mengandung pengawet?", answer: "Tidak! Semua produk kami 100% bahan alami tanpa pengawet buatan. Kami hanya menggunakan bahan-bahan segar pilihan dan proses tradisional yang aman." },
            { id: 3, question: "Bagaimana cara pengiriman?", answer: "Kami bekerja sama dengan 3 kurir terpercaya: JNE, SiCepat, dan J&T. Anda bisa memilih kurir favorit saat checkout. Pengiriman biasanya 1-3 hari kerja tergantung lokasi." },
            { id: 4, question: "Apakah produk halal?", answer: "Ya, semua produk kami telah tersertifikasi halal. Kami sangat memperhatikan setiap aspek produksi untuk memastikan kehalalan produk." },
            { id: 5, question: "Apa metode pembayaran yang tersedia?", answer: "Kami menerima transfer bank (BCA, Mandiri, BNI) dan pembayaran via QRIS. Semua metode pembayaran aman dan terpercaya." },
            { id: 6, question: "Bagaimana jika produk rusak saat pengiriman?", answer: "Jika produk rusak atau tidak sesuai, hubungi kami melalui WhatsApp dengan foto bukti. Kami akan mengganti produk Anda tanpa biaya tambahan." }
          ])
        },
        {
          key: "contact_info",
          value: JSON.stringify({
            whatsapp: "6281234567890",
            email: "info@sambalpremium.com",
            address: "Jl. Sambal No. 1, Jakarta Selatan",
            instagram: "sambalpremium",
            facebook: "sambalpremium",
            tiktok: "sambalpremium"
          })
        },
        {
          key: "testimonials_content",
          value: JSON.stringify([
            { id: 1, name: "Budi Santoso", role: "Pecinta Masakan Pedas", comment: "Sambal ini benar-benar luar biasa! Rasa yang sempurna, tidak terlalu pedas tapi cukup menggigit. Saya sudah order berkali-kali.", rating: 5, avatar: "👨" },
            { id: 2, name: "Siti Nurhaliza", role: "Chef Rumahan", comment: "Kualitas bahan-bahannya terlihat jelas. Saya gunakan untuk memasak dan hasilnya sangat memuaskan. Rekomendasi untuk semua!", rating: 5, avatar: "👩" },
            { id: 3, name: "Ahmad Wijaya", role: "Pengusaha Kuliner", comment: "Sebagai pemilik restoran, saya mencari supplier sambal berkualitas. Ini dia! Konsisten dan enak. Pelanggan saya juga suka.", rating: 5, avatar: "👨" }
          ])
        }
      ];

      const { eq } = await import("drizzle-orm");
      for (const setting of defaultSettings) {
        const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, setting.key)).limit(1);
        if (existing.length === 0) {
          await db.insert(siteSettings).values(setting);
          console.log(`✅ Seeded missing setting: ${setting.key}`);
        }
      }
      console.log("✅ Site settings check completed.");
    }

    console.log("🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
