import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  securityHeaders,
  csrfTokenMiddleware,
  validateCSRFToken,
  requestLogger,
  sanitizeInput,
  trustProxyMiddleware,
} from "./middleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function createServerApp() {
  const app = express();
  const server = createServer(app);

  // Compression middleware
  app.use(compression());

  // Trust proxy middleware (untuk production dengan reverse proxy)
  app.use(trustProxyMiddleware);

  // Security headers middleware
  app.use(securityHeaders);

  // Request logging middleware
  app.use(requestLogger);

  // Input sanitization middleware
  app.use(sanitizeInput);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Cookie parser middleware
  app.use(cookieParser());

  // CSRF token middleware
  app.use(csrfTokenMiddleware);

  // CSRF validation middleware (untuk state-changing requests)
  app.use(validateCSRFToken);

  registerStorageProxy(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return { app, server };
}

// Untuk Vercel Serverless Function
export const appPromise = createServerApp().then(({ app }) => app);
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};

// Untuk Standalone Server (VPS/Local)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  createServerApp().then(async ({ server }) => {
    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}


