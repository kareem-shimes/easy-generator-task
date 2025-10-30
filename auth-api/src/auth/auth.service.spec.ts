import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserEntity } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserId = new Types.ObjectId();
  const mockUserDocument: Partial<UserDocument> = {
    _id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserEntity: UserEntity = {
    _id: mockUserId.toString(),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
    toUserEntity: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        case 'jwt.refreshExpiresIn':
          return '7d';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully create a new user and return tokens', async () => {
      const signUpDto: SignUpDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'SecurePass123!',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUserDocument);
      mockUsersService.toUserEntity.mockReturnValue(mockUserEntity);
      mockJwtService.sign.mockReturnValueOnce('mock-access-token');
      mockJwtService.sign.mockReturnValueOnce('mock-refresh-token');

      const result = await service.signUp(signUpDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        signUpDto.email,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual({
        response: {
          user: mockUserEntity,
          access_token: 'mock-access-token',
        },
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const signUpDto: SignUpDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'SecurePass123!',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUserDocument);

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUsersService.findByEmail.mockResolvedValue(mockUserDocument);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);

      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(
        mockUserDocument,
        password,
      );
      expect(result).toEqual(mockUserDocument);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();

      expect(mockUsersService.validatePassword).not.toHaveBeenCalled();
    });

    it('should return null if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUserDocument);
      mockUsersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should return tokens for authenticated user', () => {
      mockUsersService.toUserEntity.mockReturnValue(mockUserEntity);
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');

      const result = service.signIn(mockUserDocument as UserDocument);

      expect(result).toEqual({
        response: {
          user: mockUserEntity,
          access_token: 'access-token',
        },
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens for valid user', async () => {
      const userId = mockUserId.toString();
      const email = 'test@example.com';

      mockUsersService.findById.mockResolvedValue(mockUserDocument);
      mockUsersService.toUserEntity.mockReturnValue(mockUserEntity);
      mockJwtService.sign.mockReturnValueOnce('new-access-token');
      mockJwtService.sign.mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens(userId, email);

      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        response: {
          user: mockUserEntity,
          access_token: 'new-access-token',
        },
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const userId = 'invalid-id';
      const email = 'test@example.com';

      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(userId, email)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
