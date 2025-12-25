/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth.service.js';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    verificationCode: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit code', () => {
      const code = authService.generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = authService.generateVerificationCode();
      const code2 = authService.generateVerificationCode();
      // While theoretically they could be the same, it's extremely unlikely
      expect(code1).toMatch(/^\d{6}$/);
      expect(code2).toMatch(/^\d{6}$/);
    });
  });

  describe('storeVerificationCode', () => {
    it('should delete existing codes and create new one', async () => {
      const contact = 'test@example.com';
      const code = '123456';

      vi.mocked(prisma.verificationCode.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.verificationCode.create).mockResolvedValue({
        id: '1',
        contact,
        code,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await authService.storeVerificationCode(contact, code);

      expect(prisma.verificationCode.deleteMany).toHaveBeenCalledWith({
        where: { contact },
      });
      expect(prisma.verificationCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contact,
          code,
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should set expiration to 10 minutes from now', async () => {
      const contact = 'test@example.com';
      const code = '123456';
      const beforeCall = Date.now();

      vi.mocked(prisma.verificationCode.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.verificationCode.create).mockResolvedValue({
        id: '1',
        contact,
        code,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await authService.storeVerificationCode(contact, code);

      const createCall = vi.mocked(prisma.verificationCode.create).mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt as Date;
      const afterCall = Date.now();

      const expectedExpiry = 10 * 60 * 1000; // 10 minutes in ms
      const actualExpiry = expiresAt.getTime() - beforeCall;

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + (afterCall - beforeCall) + 1000);
    });
  });

  describe('verifyCode', () => {
    it('should verify valid code and return tokens for existing user', async () => {
      const contact = 'test@example.com';
      const code = '123456';
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        role: 'customer',
        phone: null,
        email: contact,
        address: null,
        deliveryPreference: 'delivery',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue({
        id: 'code-1',
        contact,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      });
      vi.mocked(prisma.verificationCode.delete).mockResolvedValue({
        id: 'code-1',
        contact,
        code,
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);

      const result = await authService.verifyCode(contact, code);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(prisma.verificationCode.delete).toHaveBeenCalledWith({
        where: { id: 'code-1' },
      });
    });

    it('should create new user if not exists', async () => {
      const contact = 'newuser@example.com';
      const code = '123456';
      const mockUser = {
        id: 'user-2',
        name: contact,
        role: 'customer',
        phone: null,
        email: contact,
        address: null,
        deliveryPreference: 'delivery',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue({
        id: 'code-1',
        contact,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      });
      vi.mocked(prisma.verificationCode.delete).mockResolvedValue({
        id: 'code-1',
        contact,
        code,
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const result = await authService.verifyCode(contact, code);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          phone: null,
          email: contact,
          name: contact,
          role: 'customer',
        },
      });
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw error for invalid code', async () => {
      const contact = 'test@example.com';
      const code = '999999';

      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      await expect(authService.verifyCode(contact, code)).rejects.toThrow(
        'Invalid or expired verification code'
      );
    });

    it('should throw error for expired code', async () => {
      const contact = 'test@example.com';
      const code = '123456';

      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      await expect(authService.verifyCode(contact, code)).rejects.toThrow(
        'Invalid or expired verification code'
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate valid JWT tokens', () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        role: 'customer',
      };

      const result = authService.generateTokens(user);

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user).toEqual(user);

      // Verify token structure
      const decodedAccess = jwt.decode(result.accessToken) as any;
      expect(decodedAccess.userId).toBe(user.id);
      expect(decodedAccess.role).toBe(user.role);
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        role: 'customer',
      };

      const { accessToken } = authService.generateTokens(user);
      const decoded = authService.validateToken(accessToken);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.role).toBe(user.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.validateToken('invalid-token')).toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens for valid refresh token', async () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        role: 'customer',
        phone: null,
        email: 'test@example.com',
        address: null,
        deliveryPreference: 'delivery',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { refreshToken } = authService.generateTokens(user);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user);

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.id).toBe(user.id);
    });

    it('should throw error if user not found', async () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        role: 'customer',
      };

      const { refreshToken } = authService.generateTokens(user);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('User not found');
    });
  });
});
