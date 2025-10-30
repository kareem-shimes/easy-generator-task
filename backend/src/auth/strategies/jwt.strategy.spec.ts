import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

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
      if (key === 'jwt.secret') return 'test-jwt-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user info for valid JWT payload', async () => {
      const payload = {
        sub: mockUserId.toString(),
        email: 'test@example.com',
      };

      mockUsersService.findById.mockResolvedValue(mockUserDocument);

      const result = await strategy.validate(payload);

      expect(mockUsersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
      });
    });

    it('should throw UnauthorizedException if user not found or on error', async () => {
      const payload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
      };

      mockUsersService.findById.mockRejectedValue(new Error('User not found'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findById).toHaveBeenCalledWith(payload.sub);
    });
  });

  describe('constructor', () => {
    it('should throw error if JWT secret is not configured', () => {
      const mockConfigServiceNoSecret = {
        get: jest.fn(() => null),
      } as unknown as ConfigService;

      const mockUsersServiceForTest = {
        findById: jest.fn(),
      } as unknown as UsersService;

      expect(() => {
        new JwtStrategy(mockConfigServiceNoSecret, mockUsersServiceForTest);
      }).toThrow('JWT secret is not configured');
    });
  });
});
