import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Request } from 'express';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;

  const mockUserId = new Types.ObjectId();
  const mockUserDocument: Partial<UserDocument> = {
    _id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<RefreshTokenStrategy>(RefreshTokenStrategy);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user info with refresh token for valid request', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockRequest = {
        cookies: {
          refresh_token: refreshToken,
        },
      } as unknown as RequestWithCookies;

      const payload = {
        sub: mockUserId.toString(),
        email: 'test@example.com',
      };

      mockUsersService.findById.mockResolvedValue(
        mockUserDocument as UserDocument,
      );

      const result = await strategy.validate(mockRequest, payload);

      expect(mockUsersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        refreshToken,
      });
    });

    it('should throw UnauthorizedException if refresh token not in cookies', async () => {
      const mockRequest = {
        cookies: {},
      } as unknown as RequestWithCookies;

      const payload = {
        sub: mockUserId.toString(),
        email: 'test@example.com',
      };

      await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
        'Refresh token not found',
      );
    });

    it('should throw UnauthorizedException if user not found or on error', async () => {
      const mockRequest = {
        cookies: {
          refresh_token: 'valid-token',
        },
      } as unknown as RequestWithCookies;

      const payload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
      };

      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('constructor', () => {
    it('should throw error if refresh secret is not configured', () => {
      const mockConfigServiceNoSecret = {
        get: jest.fn(() => null),
      } as unknown as ConfigService;

      const mockUsersServiceForTest = {
        findById: jest.fn(),
      } as unknown as UsersService;

      expect(() => {
        new RefreshTokenStrategy(
          mockConfigServiceNoSecret,
          mockUsersServiceForTest,
        );
      }).toThrow('Refresh secret is not configured');
    });
  });
});
