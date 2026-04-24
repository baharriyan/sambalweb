import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { COOKIE_NAME } from "@shared/const";

/**
 * Security Headers Middleware
 * Menambahkan security headers yang penting untuk proteksi XSS, clickjacking, dll
 */
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS Protection (legacy, modern browsers use CSP)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict Transport Security (HSTS) - hanya untuk HTTPS
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy (CSP)
  // Dapat disesuaikan berdasarkan kebutuhan aplikasi
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
      "connect-src 'self' https: ws: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // Referrer Policy - kontrol informasi referrer yang dikirim
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (Feature Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // Smart caching: static assets get cached, dynamic content does not
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|br|gz)$/i.test(req.path)
    || req.path.startsWith("/attached_assets/")
    || req.path.startsWith("/uploads/");

  if (isStaticAsset) {
    // Static assets: cache for 1 year (immutable for hashed files)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    // Dynamic content (HTML, API responses): no cache
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
}

/**
 * CSRF Token Middleware
 * Menghasilkan dan memvalidasi CSRF token untuk proteksi terhadap Cross-Site Request Forgery
 */
const csrfTokens = new Map<string, { token: string; createdAt: number }>();
const CSRF_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 jam

// Cleanup expired tokens setiap 5 menit
setInterval(
  () => {
    const now = Date.now();

    Array.from(csrfTokens.entries()).forEach(([id, data]) => {
      if (now > data.createdAt + CSRF_TOKEN_TTL) {
        csrfTokens.delete(id);
      }
    });
  },
  5 * 60 * 1000
);

/**
 * Generate CSRF token untuk user session
 * Token ini harus diletakkan di form dan dikirim kembali sebagai header atau form data
 */
export function generateCSRFToken(sessionId: string): string {
  const token = randomBytes(32).toString("hex");
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
  });
  return token;
}

/**
 * Middleware untuk menambahkan CSRF token ke response header
 * Token akan di-set di header res.set("X-CSRF-Token", token)
 */
export function csrfTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ambil session ID dari cookie
  const sessionId =
    (req.cookies && req.cookies[COOKIE_NAME]) ||
    req.headers["x-session-id"] ||
    req.ip ||
    "unknown";

  // Generate token baru untuk GET requests atau jika belum ada
  if (!csrfTokens.has(sessionId)) {
    const token = generateCSRFToken(sessionId);
    res.setHeader("X-CSRF-Token", token);
  } else {
    const tokenData = csrfTokens.get(sessionId);
    if (tokenData) {
      res.setHeader("X-CSRF-Token", tokenData.token);
    }
  }

  next();
}

/**
 * Middleware untuk memvalidasi CSRF token
 * Hanya untuk requests yang mengubah data (POST, PUT, DELETE, PATCH)
 */
export function validateCSRFToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip validasi untuk GET requests dan OPTIONS requests
  if (
    req.method === "GET" ||
    req.method === "OPTIONS" ||
    req.method === "HEAD"
  ) {
    return next();
  }

  // Skip validasi untuk tRPC endpoints (mereka punya security sendiri)
  if (req.path.startsWith("/api/trpc")) {
    return next();
  }

  // Skip validasi untuk API routes yang tidak perlu (misal public endpoints)
  const publicEndpoints = [
    "/api/auth/callback",
    "/api/auth/logout",
    "/api/payments/webhook",
  ];
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  // Ambil CSRF token dari header atau form data
  const token =
    req.headers["x-csrf-token"] || req.body?.csrfToken || req.query?.csrfToken;

  // Ambil session ID
  const sessionId =
    (req.cookies && req.cookies[COOKIE_NAME]) ||
    req.headers["x-session-id"] ||
    req.ip ||
    "unknown";

  // Validasi token
  const storedTokenData = csrfTokens.get(sessionId);

  if (!storedTokenData || storedTokenData.token !== token) {
    res.status(403).json({
      error: "CSRF token validation failed",
      code: "INVALID_CSRF_TOKEN",
    });
    return;
  }

  // Token valid - refresh token untuk next request
  generateCSRFToken(sessionId);

  next();
}

/**
 * Rate Limiting Middleware
 * Melindungi dari brute force attacks dan DDoS
 */
interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Create rate limiter dengan custom options
 * @param windowMs - Time window dalam milliseconds
 * @param maxRequests - Maximum requests dalam time window
 * @param message - Error message
 */
export function createRateLimiter(
  windowMs: number = 15 * 60 * 1000, // 15 minutes default
  maxRequests: number = 100,
  message: string = "Too many requests, please try again later"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const data = rateLimitStore.get(key);

    // Jika key tidak ada atau window sudah expired, reset counter
    if (!data || now > data.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    // Increment counter
    data.count++;

    // Jika exceeds limit, return error
    if (data.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((data.resetTime - now) / 1000));
      res.status(429).json({
        error: message,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((data.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Login Rate Limiter
 * Lebih ketat untuk login endpoint - max 50 attempts per 15 minutes per IP
 */
export const loginRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  50,
  "Terlalu banyak upaya login gagal. Silakan coba lagi dalam 15 menit."
);

/**
 * API Rate Limiter
 * Standar untuk API endpoints
 */
export const apiRateLimiter = createRateLimiter(
  60 * 1000,
  1000,
  "Terlalu banyak requests. Silakan tunggu sebentar."
);

/**
 * Request Logging Middleware
 * Log semua incoming requests untuk debugging dan monitoring
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Simply continue to the next middleware
  // Real logging can be added here if needed without monkey-patching res.send
  next();
}

/**
 * Input Sanitization Middleware
 * Sanitize input untuk mencegah injection attacks
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Sanitize req.body
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body as Record<string, unknown>);
  }

  // Sanitize req.query
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query as Record<string, unknown>);
  }

  next();
}

/**
 * Recursive sanitization function
 * Menghapus potential XSS/injection content
 */
function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Sanitize strings
      if (typeof value === "string") {
        obj[key] = sanitizeString(value);
      }
      // Recursively sanitize nested objects
      else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        sanitizeObject(value as Record<string, unknown>);
      }
      // Sanitize array items
      else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "string") {
            (value as unknown[])[index] = sanitizeString(item);
          } else if (typeof item === "object" && item !== null) {
            sanitizeObject(item as Record<string, unknown>);
          }
        });
      }
    }
  }
}

/**
 * Basic string sanitization
 * Menghapus dangerous characters/patterns
 */
function sanitizeString(str: string): string {
  // Remove potential script tags dan event handlers
  const sanitized = str
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "");

  return sanitized;
}

/**
 * Trust Proxy Middleware
 * Configure untuk production dengan reverse proxy (nginx, cloudflare, etc)
 */
export function trustProxyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV === "production") {
    // Set proxy dari environment atau default ke common proxies
    const proxyCount = process.env.PROXY_COUNT || "1";
    req.app?.set("trust proxy", parseInt(proxyCount));
  }
  next();
}
