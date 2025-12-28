import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { auditService } from './audit.service.js';
import { env } from '../config/env.js';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export class AuthService {
  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store verification code with 10-minute expiration
   */
  async storeVerificationCode(contact: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing codes for this contact
    await prisma.verificationCode.deleteMany({
      where: { contact },
    });

    // Create new verification code
    await prisma.verificationCode.create({
      data: {
        contact,
        code,
        expiresAt,
      },
    });
  }

  /**
   * Verify the code and return user if valid
   */
  async verifyCode(contact: string, code: string): Promise<AuthToken> {
    // Find the verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        contact,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      // Log failed authentication attempt
      await auditService.log({
        action: 'AUTH_FAILED',
        resource: 'authentication',
        details: JSON.stringify({ contact, reason: 'Invalid or expired code' }),
      });
      throw new Error('Invalid or expired verification code');
    }

    // Delete the used verification code
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: contact },
          { email: contact },
        ],
      },
    });

    if (!user) {
      // Create new customer user
      user = await prisma.user.create({
        data: {
          phone: contact.includes('@') ? null : contact,
          email: contact.includes('@') ? contact : null,
          name: contact,
          role: 'customer',
        },
      });
    }

    // Log successful authentication
    await auditService.log({
      userId: user.id,
      action: 'AUTH_SUCCESS',
      resource: 'authentication',
      details: JSON.stringify({ contact }),
    });

    // Generate tokens
    return this.generateTokens(user);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  generateTokens(user: { id: string; name: string; role: string }): AuthToken {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Validate JWT token and return user data
   */
  validateToken(token: string): { userId: string; role: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        role: string;
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    const decoded = this.validateToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user);
  }

  /**
   * One-click login for development
   */
  async devLogin(email: string): Promise<AuthToken> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This feature is only available in development');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user);
  }
}

export const authService = new AuthService();
