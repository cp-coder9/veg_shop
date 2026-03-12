import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Server
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // WhatsApp (optional in development)
  WHATSAPP_API_URL: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),

  // Email (optional in development)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  // File Storage
  FILE_STORAGE_PATH: z.string().default('./uploads'),

  // Rate Limiting
  RATE_LIMIT_VERIFICATION_CODES: z.string().default('3').transform(Number),
  RATE_LIMIT_API_REQUESTS: z.string().default('100').transform(Number),
  RATE_LIMIT_LOGIN_ATTEMPTS: z.string().default('5').transform(Number),

  // Firebase (Required for Firestore migration)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  USE_FIREBASE: z.string().default('false').transform((val: string) => val === 'true'),

  // Yoco Payment Gateway
  YOCO_SECRET_KEY: z.string().optional(),
  YOCO_PUBLIC_KEY: z.string().optional(),
  YOCO_WEBHOOK_SECRET: z.string().optional(),
});

// Validate environment variables
function validateEnv(): z.infer<typeof envSchema> {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    console.error('❌ Invalid environment variables:', (error as any).errors || error);
    process.exit(1);
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

// Log configuration (for debugging)
export function logConfig(): void {
  console.log('📋 Configuration:');
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - Port: ${env.PORT}`);
  console.log(`  - CORS Origin: ${env.CORS_ORIGIN}`);
  console.log(`  - Database: ${env.DATABASE_URL ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  - WhatsApp: ${env.WHATSAPP_API_URL ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  - SendGrid: ${env.SENDGRID_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  - Yoco: ${env.YOCO_SECRET_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log('');
}
