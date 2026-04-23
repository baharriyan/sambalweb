/**
 * XSS Protection & Input Sanitization
 * Utility functions untuk prevent XSS attacks
 */

/**
 * Escape HTML special characters
 * Prevents script injection in rendered text
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, char => map[char] || char);
}

/**
 * Sanitize user input to prevent XSS
 * Remove potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Trim whitespace
  let sanitized = input.trim();

  // Escape HTML entities
  sanitized = escapeHtml(sanitized);

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");

  return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return sanitizeInput(email.toLowerCase().trim());
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitize phone number (remove special chars except +, -, spaces)
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+\-\s]/g, "").trim();
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(value: unknown): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Deep sanitize object (recursively sanitize all string values)
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== "object" || obj === null) {
    return (typeof obj === "string" ? sanitizeInput(obj) : obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  const sanitized = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized as unknown as T;
}

/**
 * Check if string contains potential XSS payloads
 */
export function containsXssPayload(str: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(str));
}

/**
 * Validate input against XSS and return result with sanitized value
 */
export function validateAndSanitize(
  input: string,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customSanitizer?: (input: string) => string;
  } = {}
): { valid: boolean; sanitized: string; error?: string } {
  if (!input) {
    return { valid: false, sanitized: "", error: "Input cannot be empty" };
  }

  if (options.minLength && input.length < options.minLength) {
    return {
      valid: false,
      sanitized: "",
      error: `Input must be at least ${options.minLength} characters`,
    };
  }

  if (options.maxLength && input.length > options.maxLength) {
    return {
      valid: false,
      sanitized: "",
      error: `Input must not exceed ${options.maxLength} characters`,
    };
  }

  if (containsXssPayload(input)) {
    return {
      valid: false,
      sanitized: "",
      error: "Input contains potentially dangerous content",
    };
  }

  if (options.pattern && !options.pattern.test(input)) {
    return { valid: false, sanitized: "", error: "Input format is invalid" };
  }

  let sanitized = sanitizeInput(input);
  if (options.customSanitizer) {
    sanitized = options.customSanitizer(sanitized);
  }

  return { valid: true, sanitized };
}
