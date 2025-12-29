import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
      // If logging in via phone/email code and user doesn't exist, create a customer account
      // Note: This is "implicit registration" via OTP
      user = await prisma.user.create({
        data: {
          phone: contact.includes('@') ? null : contact,
          email: contact.includes('@') ? contact : null,
          name: contact, // Temporary name
          role: 'customer',
        },
      });
    }

    // Log successful authentication
    await auditService.log({
      userId: user.id,
      action: 'AUTH_SUCCESS',
      resource: 'authentication',
      details: JSON.stringify({ contact, method: 'otp' }),
    });

    return this.generateTokens(user);
  }

  /**
   * Register a new user with email and password
   */
  async register(data: { name: string; email: string; password: string; phone?: string; address?: string }): Promise<AuthToken> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if phone already exists (if provided)
    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        throw new Error('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        address: data.address || null,
        role: 'customer', // Default role
      },
    });

    // Log successful registration
    await auditService.log({
      userId: user.id,
      action: 'REGISTER_SUCCESS',
      resource: 'authentication',
      details: JSON.stringify({ email: data.email }),
    });

    return this.generateTokens(user);
  }

  /**
   * Login with email and password
   */
  async login(data: { email: string; password: string }): Promise<AuthToken> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      // Log failed attempt
      await auditService.log({
        action: 'AUTH_FAILED',
        resource: 'authentication',
        details: JSON.stringify({ email: data.email, reason: 'User not found or no password set' }),
      });
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      // Log failed attempt
      await auditService.log({
        action: 'AUTH_FAILED',
        resource: 'authentication',
        details: JSON.stringify({ email: data.email, reason: 'Invalid password' }),
      });
      throw new Error('Invalid email or password');
    }

    // Log successful login
    await auditService.log({
      userId: user.id,
      action: 'AUTH_SUCCESS',
      resource: 'authentication',
      details: JSON.stringify({ email: data.email, method: 'password' }),
    });

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
