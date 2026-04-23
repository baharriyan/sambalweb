# Sambal E-Commerce Setup Guide

## Prerequisites

- Node.js (v18+)
- pnpm (package manager)
- MySQL database running

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

The `.env` file has been created with default values. Update it with your actual credentials:

```env
# Database - Update with your MySQL connection
DATABASE_URL=mysql://root:root@localhost:3306/sambal_ecommerce

# JWT Secret - Change for production
JWT_SECRET=dev-secret-key-change-in-production

# OAuth Server URL - Update with your OAuth provider
OAUTH_SERVER_URL=http://localhost:8080
OWNER_OPEN_ID=dev-owner-id
```

### 3. Database Setup

Make sure MySQL is running and create the database:

```bash
# Using MySQL client
mysql -u root -p -e "CREATE DATABASE sambal_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Run Database Migrations

```bash
pnpm run db:push
```

### 5. Start Development Server

```bash
pnpm run dev
```

The app will be available at `http://localhost:3000` (or next available port).

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Run production build
- `pnpm run check` - TypeScript type checking
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run tests with Vitest
- `pnpm run db:push` - Create/update database schema

## Troubleshooting

### PORT_ALREADY_IN_USE

The app auto-finds available ports from 3000-3019.

### DATABASE_URL Missing

Ensure `.env` file has `DATABASE_URL` set with valid MySQL credentials.

### Dependencies Issues

Try clearing pnpm cache:

```bash
pnpm store prune
pnpm install
```
