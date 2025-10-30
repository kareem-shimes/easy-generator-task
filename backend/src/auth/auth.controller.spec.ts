import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Response as ExpressResponse } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserEntity } from '../users/entities/user.entity';
import { UserDocument } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUserEntity: UserEntity = {
    _id: new Types.ObjectId().toString(),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse: AuthResponseDto = {
    user: mockUserEntity,
    access_token: 'mock-access-token',
  };

  const mockRefreshToken = 'mock-refresh-token';

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockResponse: Partial<ExpressResponse> = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset to default 'development' environment
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'nodeEnv') return 'development';
      return null;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user and return auth response', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!',
      };

      mockAuthService.signUp.mockResolvedValue({
        response: mockAuthResponse,
        refreshToken: mockRefreshToken,
      });

      const result = await controller.signUp(
        signUpDto,
        mockResponse as ExpressResponse,
      );

      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(mockAuthResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockRefreshToken,
        {
          httpOnly: false, // development mode - visible for debugging
          secure: false, // development mode
          sameSite: 'lax', // development mode - for cross-origin
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        },
      );
    });

    it('should set secure cookie in production', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!',
      };

      mockConfigService.get.mockReturnValue('production');
      mockAuthService.signUp.mockResolvedValue({
        response: mockAuthResponse,
        refreshToken: mockRefreshToken,
      });

      await controller.signUp(signUpDto, mockResponse as ExpressResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockRefreshToken,
        expect.objectContaining({
          secure: true,
        }),
      );
    });

    it('should throw error if user already exists', async () => {
      const signUpDto: SignUpDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'SecurePass123!',
      };

      mockAuthService.signUp.mockRejectedValue(
        new Error('User with this email already exists'),
      );

      await expect(
        controller.signUp(signUpDto, mockResponse as ExpressResponse),
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('signIn', () => {
    it('should sign in user and return auth response', () => {
      const mockRequest: { user: UserDocument } = {
        user: {
          _id: new Types.ObjectId(),
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed-password',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as UserDocument,
      };

      mockAuthService.signIn.mockReturnValue({
        response: mockAuthResponse,
        refreshToken: mockRefreshToken,
      });

      const result = controller.signIn(
        mockRequest,
        mockResponse as ExpressResponse,
      );

      expect(mockAuthService.signIn).toHaveBeenCalledWith(mockRequest.user);
      expect(result).toEqual(mockAuthResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockRefreshToken,
        {
          httpOnly: false, // development mode
          secure: false,
          sameSite: 'lax', // development mode
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        },
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and return new auth response', async () => {
      const mockRequest: { user: { userId: string; email: string } } = {
        user: {
          userId: mockUserEntity._id,
          email: mockUserEntity.email,
        },
      };

      mockAuthService.refreshTokens.mockResolvedValue({
        response: mockAuthResponse,
        refreshToken: mockRefreshToken,
      });

      const result = await controller.refresh(
        mockRequest,
        mockResponse as ExpressResponse,
      );

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        mockRequest.user.userId,
        mockRequest.user.email,
      );
      expect(result).toEqual(mockAuthResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockRefreshToken,
        {
          httpOnly: false, // development mode
          secure: false,
          sameSite: 'lax', // development mode
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        },
      );
    });

    it('should throw error for invalid refresh token', async () => {
      const mockRequest: { user: { userId: string; email: string } } = {
        user: {
          userId: 'invalid-id',
          email: 'test@example.com',
        },
      };

      mockAuthService.refreshTokens.mockRejectedValue(
        new Error('Invalid refresh token'),
      );

      await expect(
        controller.refresh(mockRequest, mockResponse as ExpressResponse),
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie and return success message', () => {
      const mockRequest: { cookies: { refresh_token?: string } } = {
        cookies: {
          refresh_token: 'valid-refresh-token',
        },
      };

      const result = controller.logout(
        mockRequest,
        mockResponse as ExpressResponse,
      );

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        httpOnly: false, // development mode
        secure: false,
        sameSite: 'lax', // development mode
        path: '/',
      });
    });

    it('should clear secure cookie in production', () => {
      mockConfigService.get.mockReturnValue('production');

      const mockRequest: { cookies: { refresh_token?: string } } = {
        cookies: {
          refresh_token: 'valid-refresh-token',
        },
      };

      controller.logout(mockRequest, mockResponse as ExpressResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          secure: true,
        }),
      );
    });

    it('should throw UnauthorizedException if no refresh token cookie exists', () => {
      const mockRequest: { cookies: { refresh_token?: string } } = {
        cookies: {},
      };

      expect(() =>
        controller.logout(mockRequest, mockResponse as ExpressResponse),
      ).toThrow('No refresh token found');
    });

    it('should throw UnauthorizedException if cookies object is undefined', () => {
      const mockRequest = {} as { cookies: { refresh_token?: string } };

      expect(() =>
        controller.logout(mockRequest, mockResponse as ExpressResponse),
      ).toThrow('No refresh token found');
    });
  });
});
