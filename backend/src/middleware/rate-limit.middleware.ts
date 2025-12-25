import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Rate limiter for verification code sending
 * Limit: 3 requests per hour per contact
 */
export const verificationCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many verification code requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use contact from request body as key
  keyGenerator: (req) => {
    const contact = (req.body as { contact?: string }).contact;
    return contact || ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },
});

/**
 * Rate limiter for login attempts
 * Limit: 5 requests per hour per contact
 */
export const loginAttemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use contact from request body as key
  keyGenerator: (req) => {
    const contact = (req.body as { contact?: string }).contact;
    return contact || ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },
});

/**
 * General API rate limiter
 * Limit: 100 requests per minute per user
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID from auth or IP address
  keyGenerator: (req) => {
    return req.user?.userId || ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },
});