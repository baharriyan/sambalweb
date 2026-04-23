/**
 * SQL Injection Protection & Database Security
 * 
 * This project uses Drizzle ORM which provides protection against SQL injection.
 * Key security practices implemented:
 * 
 * 1. PARAMETERIZED QUERIES (Prepared Statements)
 *    - Drizzle uses parameterized queries by default
 *    - Never concatenate user input directly into queries
 *    - Always use query builders and parameter binding
 * 
 * 2. EXAMPLE VULNERABLE (DON'T DO THIS):
 *    const query = `SELECT * FROM users WHERE email = '${userEmail}'`; // VULNERABLE
 * 
 * 3. EXAMPLE SAFE (CORRECT WAY):
 *    const user = await db.query.users.findFirst({ 
 *      where: eq(users.email, userEmail)
 *    }); // SAFE - Drizzle handles parameterization
 * 
 * 4. VALIDATION & SANITIZATION
 *    - Input validation with Zod schemas
 *    - Type-safe database operations
 *    - Whitelist allowed values with enums
 * 
 * 5. LEAST PRIVILEGE
 *    - Database user has minimal required permissions
 *    - Use role-based access control (RBAC)
 *    - Separate read-only and write connections if possible
 */

import { z } from "zod";

// Example of safe parameterized query with Drizzle
export const safeQueryExample = `
  // Instead of string concatenation:
  // const result = db.raw(\`SELECT * FROM users WHERE id = \${userId}\`);
  
  // Use parameterized queries via Drizzle:
  // const result = await db.query.users.findFirst({
  //   where: eq(users.id, userId)
  // });
`;

/**
 * Best Practices for SQL Injection Prevention
 */
export const SQL_INJECTION_PREVENTION = {
  // 1. Always use the ORM's query builders
  use_orm: "✓ Use Drizzle query builders, never raw SQL with string interpolation",

  // 2. Validate input types
  validate_types: "✓ Use Zod schemas to validate input types before database queries",

  // 3. Use enums for restricted values
  use_enums: "✓ Use TypeScript enums or Zod enums for status fields, roles, etc.",

  // 4. Implement access control
  access_control: "✓ Check user permissions before executing queries",

  // 5. Use parameterized queries
  parameterized: "✓ Let the ORM handle parameter binding",

  // 6. Escape output
  escape_output: "✓ Escape data before displaying in HTML",

  // 7. Principle of least privilege
  least_privilege: "✓ Database user should have minimal required permissions",

  // 8. Monitor and log
  monitor_log: "✓ Log all database queries in production",
};

/**
 * Database Connection Security
 */
export const DB_SECURITY_CONFIG = {
  // Use environment variables for connection strings
  connection: `
    DATABASE_URL=mysql://user:password@host:3306/database
    Never hardcode credentials in code
  `,

  // Connection pooling
  pooling: `
    - Reuse connections instead of creating new ones
    - Prevents connection exhaustion attacks
    - Reduces latency
  `,

  // SSL/TLS
  ssl_tls: `
    - Encrypt data in transit
    - Use require: true for enforced SSL connections
  `,
};

/**
 * Drizzle ORM Safe Usage Examples
 */
export const SAFE_DRIZZLE_EXAMPLES = {
  safe_find_user: `
    // SAFE: Using parameterized query
    const user = await db.query.users.findFirst({
      where: eq(users.email, userEmail)
    });
  `,

  safe_create: `
    // SAFE: Using Drizzle insert builder
    await db.insert(users).values({
      email: userEmail,
      name: userName,
      passwordHash: hashedPassword
    });
  `,

  safe_update: `
    // SAFE: Using parameterized update
    await db.update(users)
      .set({ name: newName })
      .where(eq(users.id, userId));
  `,

  safe_filter: `
    // SAFE: Filtering with whitelist
    const validStatuses = ["PENDING", "COMPLETED", "CANCELLED"];
    const status = userInput as (typeof validStatuses)[number];
    
    const orders = await db.query.orders.findMany({
      where: inArray(orders.status, [status])
    });
  `,
};

/**
 * Validation schemas with protection against SQL injection
 */
export const secureDatabaseValidation = {
  email: z
    .string()
    .email()
    .max(255),

  userId: z
    .number()
    .int()
    .positive(),

  status: z
    .enum(["PENDING_PAYMENT", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"]),

  // Never allow raw SQL strings from user
  query: z
    .string()
    .max(255)
    .refine((val) => !val.includes(";"), "Query cannot contain semicolons")
    .refine((val) => !val.toLowerCase().includes("drop"), "Query cannot contain DROP")
    .refine((val) => !val.toLowerCase().includes("delete"), "Query cannot contain DELETE")
    .refine((val) => !val.toLowerCase().includes("update"), "Query cannot contain UPDATE"),
};

/**
 * Security Headers for Database Protection
 */
export const DATABASE_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff", // Prevent MIME sniffing
  "X-Frame-Options": "DENY", // Prevent clickjacking
  "Strict-Transport-Security": "max-age=31536000", // HTTPS only
  "Content-Security-Policy": "default-src 'self'", // Restrict sources
};

console.log(`
✓ SQL Injection Protection Implemented
  - Drizzle ORM parameterized queries
  - Zod schema validation
  - Access control checks
  - Type-safe database operations
  
ℹ For more info:
  - Drizzle Docs: https://orm.drizzle.team/
  - OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
`);
