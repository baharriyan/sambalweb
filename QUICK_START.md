# 🚀 QUICK START - SAMBAL E-COMMERCE

Setup dan jalankan project dalam 5 menit!

---

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

#### Option A: Menggunakan MySQL yang sudah exist

```bash
# Edit .env file dan set DATABASE_URL
# Contoh:
# DATABASE_URL="mysql://root:password@localhost:3306/sambal_ecommerce"

# Jalankan migrations
pnpm run db:push
```

#### Option B: Buat database baru

```bash
# Login ke MySQL
mysql -u root -p

# Run di MySQL console
CREATE DATABASE sambal_ecommerce;
CREATE USER 'sambal'@'localhost' IDENTIFIED BY 'sambal123';
GRANT ALL PRIVILEGES ON sambal_ecommerce.* TO 'sambal'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Set di .env
DATABASE_URL="mysql://sambal:sambal123@localhost:3306/sambal_ecommerce"

# Run migrations
pnpm run db:push
```

### 3. Environment Setup

```bash
# Create .env file di root project
cat > .env << EOF
DATABASE_URL="mysql://sambal:sambal123@localhost:3306/sambal_ecommerce"
NODE_ENV="development"
PORT=3000
OWNER_OPEN_ID="test_owner_id"
EOF
```

### 4. Seed Data (Optional)

```bash
# Add sample products & data
node seed.mjs
```

### 5. Start Development Server

```bash
pnpm run dev
```

🎉 **Done!** Open http://localhost:3000

---

## 🧪 Test Features

### 1. Browse Products

- Go to http://localhost:3000/catalog
- Search & filter products

### 2. Add to Cart (Guest)

- Click product → "Add to Cart"
- Cart drawer opens → Review items
- Items saved di localStorage

### 3. Checkout (Guest)

- Click "Checkout" di cart drawer
- Fill form → Submit
- See order confirmation page

### 4. Try as User (Optional)

- Login dengan OAuth
- Add items to cart
- Cart items akan save ke database
- Checkout like normal

### 5. Admin Dashboard

- Login dengan `OWNER_OPEN_ID` user
- Go to http://localhost:3000/admin
- View dashboard stats

---

## 📁 Key Files

```
PROJECT/
├── server/
│   ├── _core/
│   │   ├── middleware.ts          ← Security & rate limiting
│   │   └── index.ts               ← Express setup
│   ├── routers.ts                 ← tRPC routes
│   └── db.ts                       ← Database helpers
├── client/src/
│   ├── contexts/
│   │   └── CartContext.tsx         ← Cart state management
│   ├── components/
│   │   ├── MiniCartDrawer.tsx      ← Cart sidebar
│   │   └── Navbar.tsx              ← Updated with cart
│   ├── pages/
│   │   ├── Checkout.tsx            ← Checkout form
│   │   ├── OrderConfirmation.tsx    ← Post-order page
│   │   └── ...
│   ├── lib/
│   │   └── validation.ts           ← Zod schemas
│   └── App.tsx                      ← Routes & providers
├── drizzle/
│   ├── schema.ts                   ← Database schema
│   └── migrations/                 ← DB migrations
├── COMPLETION_SUMMARY.md           ← Full documentation
└── QUICK_START.md                  ← This file
```

---

## 🔍 What's New

✨ **NEW IN THIS UPDATE**:

1. **Security Middleware** (`server/_core/middleware.ts`)
   - Security headers, CSRF protection, rate limiting
   - Integrated into Express

2. **Cart Management** (`CartContext.tsx`)
   - Guest cart (localStorage)
   - User cart (database)
   - Automatic sync when user logs in

3. **Mini Cart Drawer** (`MiniCartDrawer.tsx`)
   - Beautiful sidebar cart preview
   - Quantity controls, price calculation
   - Checkout integration

4. **Order Confirmation** (`OrderConfirmation.tsx`)
   - Post-order success page
   - Payment instructions
   - Order number display & copy
   - Bank details for manual transfer

5. **Form Validation** (`validation.ts`)
   - 15+ Zod schemas
   - All forms covered
   - Helper functions for validation

---

## 🎯 Common Commands

```bash
# Run dev server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Run tests
pnpm test

# Generate DB migrations
pnpm run db:push

# Format code
pnpm run format

# Type check
pnpm run check
```

---

## 🔧 Troubleshooting

### Port 3000 sudah digunakan?

```bash
# Kill process di port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

### Database connection error?

```bash
# Verify MySQL running
mysql -u root -p -e "SELECT 1"

# Check DATABASE_URL di .env
# Format: mysql://user:password@host:port/database
```

### Cart tidak appear di mobile?

```bash
# Clear localStorage
localStorage.clear()
# Refresh browser
```

### OAuth login tidak jalan?

```bash
# Check OWNER_OPEN_ID di .env set dengan benar
# Verify OAuth server accessible
```

---

## 📊 Database

### Current Tables

- `users` - User accounts
- `products` - Sambal products
- `cartItems` - Shopping cart
- `orders` - Orders
- `orderItems` - Order line items
- `addresses` - Shipping addresses

### Sample Data (dari seed.mjs)

Biasanya sudah ada 4 sambal products:

1. Sambal Bawang - Rp25,000
2. Sambal Teri Medan - Rp30,000
3. Sambal Matah - Rp28,000
4. Sambal Olek - Rp22,000

---

## 🔐 Security Features

✅ Enabled:

- Security headers (CSP, X-Frame-Options)
- CSRF token validation
- Rate limiting (login: 5/15min, API: 60/min)
- Input sanitization
- XSS protection
- SQL injection prevention (Drizzle ORM)

---

## 📱 Testing Checklist

- [ ] Add product to cart (guest)
- [ ] Update quantity in cart
- [ ] Remove item from cart
- [ ] Clear all cart items
- [ ] Checkout as guest
- [ ] See order confirmation
- [ ] Copy order number
- [ ] See payment instructions
- [ ] Login as user
- [ ] Add items & checkout
- [ ] View order in dashboard
- [ ] Check admin dashboard

---

## 🎨 UI Customization

### Theme

Edit di `client/src/contexts/ThemeContext.tsx`

### Colors

Edit TailwindCSS classes (currently using red/orange gradient)

### Styling

All components use TailwindCSS - edit classes directly in components

---

## 🚨 Important Notes

1. **OAuth Required**: Project uses OAuth for authentication
   - Login button redirects ke OAuth provider
   - Set `OWNER_OPEN_ID` untuk admin access

2. **Guest Checkout**: Fully supported
   - Cart saved di browser localStorage
   - No account needed

3. **Payment**: Manual transfer flow
   - Bank details shown after order
   - No automatic payment integration yet

4. **Images**: Using URLs
   - Untuk production, setup S3/cloud storage

---

## 💡 Tips

- **Check Console**: Open DevTools untuk see API calls
- **Network Tab**: Verify tRPC requests berhasil
- **Application Tab**: Inspect localStorage untuk guest cart
- **Database**: Use `adminer` atau MySQL GUI untuk explore data

---

## 📞 Need Help?

1. Check `COMPLETION_SUMMARY.md` untuk full documentation
2. Check error messages di console
3. Verify .env file setup correctly
4. Check database connection
5. Review tRPC network requests

---

**Happy coding! 🚀**

Questions? Check the source files or COMPLETION_SUMMARY.md for detailed documentation.
