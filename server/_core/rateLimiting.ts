import { Request, Response, NextFunction } from "express";

export interface RateLimitConfig {
  windowMs: number; // Time window dalam milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RequestRecord>();

// Cleanup expired records setiap 1 menit
setInterval(() => {
  const now = Date.now();
  Array.from(requestCounts.entries()).forEach(([key, record]) => {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  });
}, 60 * 1000);

/**
 * Create rate limiter middleware
 * @param config Rate limit configuration
 * @returns Express middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Gunakan IP address sebagai identifier (bisa disesuaikan)
    const key = `${req.ip || req.connection.remoteAddress}:${req.path}`;

    const now = Date.now();
    const record = requestCounts.get(key);

    if (record && now < record.resetTime) {
      if (record.count >= config.maxRequests) {
        return res.status(429).json({
          error: config.message || "Too many requests, please try again later",
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      }
      record.count++;
    } else {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
    }

    next();
  };
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Strict limiting untuk auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  },

  // Moderate limiting untuk API endpoints
  API: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: "Terlalu banyak requests. Coba lagi dalam beberapa saat.",
  },

  // Light limiting untuk general endpoints
  GENERAL: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: "Terlalu banyak requests. Coba lagi dalam beberapa saat.",
  },

  // Strict limiting untuk password reset
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    message: "Terlalu banyak percobaan reset password. Coba lagi dalam 1 jam.",
  },
};

/**
 * Get client IP address (accounting for proxies)
 */
export function getClientIp(req: Request): string {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Check if IP is already blocked (temporary ban)
 */
const blockedIps = new Map<string, number>();

export function isIpBlocked(ip: string): boolean {
  const blockTime = blockedIps.get(ip);
  if (!blockTime) return false;

  if (Date.now() < blockTime) {
    return true;
  }

  blockedIps.delete(ip);
  return false;
}

/**
 * Block an IP address for a specified duration
 */
export function blockIp(ip: string, durationMs: number): void {
  blockedIps.set(ip, Date.now() + durationMs);
}

/**
 * Middleware to check if IP is blocked
 */
export function checkBlockedIp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = getClientIp(req);

  if (isIpBlocked(ip)) {
    return res.status(403).json({
      error:
        "Your IP has been temporarily blocked due to too many failed attempts. Please try again later.",
    });
  }

  next();
}

