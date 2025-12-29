import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { verificationCodeLimiter, loginAttemptLimiter } from '../middleware/rate-limit.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { sendCodeSchema, verifyCodeSchema, refreshTokenSchema, registerSchema, loginSchema } from '../schemas/validation.schemas.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * POST /api/auth/send-code
 * Send verification code to phone or email
 */
router.post(
  '/send-code',
  verificationCodeLimiter,
  validate(sendCodeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { contact } = req.body as { contact: string };

    // Generate verification code
    const code = authService.generateVerificationCode();

    // Store verification code
    await authService.storeVerificationCode(contact, code);

    // Send verification code
    await notificationService.sendVerificationCode(contact, code);

    return res.json({
      message: 'Verification code sent successfully',
      contact,
    });
  })
);

/**
 * POST /api/auth/verify-code
 * Verify code and return JWT tokens
 */
router.post(
  '/verify-code',
  loginAttemptLimiter,
  validate(verifyCodeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { contact, code } = req.body as { contact: string; code: string };

    try {
      // Verify code and get tokens
      const authToken = await authService.verifyCode(contact, code);

      return res.json(authToken);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid or expired verification code') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CODE',
            message: error.message,
          },
        });
      }

      console.error('Verify code error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify code',
        },
      });
    }
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };

    try {
      // Refresh tokens
      const authToken = await authService.refreshToken(refreshToken);

      return res.json(authToken);
    } catch (error) {
      if (error instanceof Error && error.message.includes('token')) {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired refresh token',
          },
        });
      }

      console.error('Refresh token error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to refresh token',
        },
      });
    }
  })
);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    try {
      const authToken = await authService.register(data);
      return res.status(201).json(authToken);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('already registered'))) {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: error.message,
          },
        });
      }
      throw error;
    }
  })
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  loginAttemptLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    try {
      const authToken = await authService.login(data);
      return res.json(authToken);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid email or password') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }
      throw error;
    }
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user profile',
      },
    });
  }
}));

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, no server action needed)
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({
    message: 'Logged out successfully',
  });
});

// One-click login for development
if (process.env.NODE_ENV === 'development') {
  console.log('Registering /dev-login route. NODE_ENV:', process.env.NODE_ENV);
  router.post(
    '/dev-login',
    asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.body as { email: string };

      try {
        const authToken = await authService.devLogin(email);
        return res.json(authToken);
      } catch (error) {
        if (error instanceof Error) {
          return res.status(404).json({
            error: {
              code: 'USER_NOT_FOUND',
              message: error.message,
            },
          });
        }
        return res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to login',
          },
        });
      }
    })
  );
}

export default router;
