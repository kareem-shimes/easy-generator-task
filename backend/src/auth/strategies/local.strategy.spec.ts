import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UserDocument } from '../../users/schemas/user.schema';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  const mockUserId = new Types.ObjectId();
  const mockUserDocument: Partial<UserDocument> = {
    _id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'correct-password';

      mockAuthService.validateUser.mockResolvedValue(
        mockUserDocument as UserDocument,
      );

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
      expect(result).toEqual(mockUserDocument);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrong-password';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });
});
