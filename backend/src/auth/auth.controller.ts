import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Response,
  HttpException,
} from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { UserDocument } from '../users/schemas/user.schema';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { WrappedErrorResponseDto } from '../common/dto/wrapped-response.dto';

@ApiTags('authentication')
@ApiExtraModels(AuthResponseDto, WrappedErrorResponseDto)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @ResponseMessage('User created successfully')
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'Creates a new user account and returns access token. Sets httpOnly refresh token cookie.',
  })
  @ApiResponse({
    status: 201,
    description:
      'User created successfully. Returns access token in body and sets refresh_token httpOnly cookie.',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User created successfully' },
            data: { $ref: getSchemaPath(AuthResponseDto) },
          },
        },
      ],
    },
    headers: {
      'Set-Cookie': {
        description: 'refresh_token httpOnly cookie (7 days expiry)',
        schema: {
          type: 'string',
          example:
            'refresh_token=eyJhbGc...; Path=/; HttpOnly; SameSite=Lax (dev) or Strict (prod)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failed',
    type: WrappedErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
    type: WrappedErrorResponseDto,
  })
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const { response, refreshToken } = await this.authService.signUp(signUpDto);

    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: this.configService.get('nodeEnv') === 'production', // Visible in dev for debugging
      secure: this.configService.get('nodeEnv') === 'production',
      sameSite:
        this.configService.get('nodeEnv') === 'production' ? 'strict' : 'lax', // Lax for cross-origin dev
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return response;
  }

  @Post('signin')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User signed in successfully')
  @ApiOperation({
    summary: 'Sign in an existing user',
    description:
      'Authenticates user credentials and returns access token. Sets httpOnly refresh token cookie.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'User signed in successfully. Returns access token in body and sets refresh_token httpOnly cookie.',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User signed in successfully' },
            data: { $ref: getSchemaPath(AuthResponseDto) },
          },
        },
      ],
    },
    headers: {
      'Set-Cookie': {
        description: 'refresh_token httpOnly cookie (7 days expiry)',
        schema: {
          type: 'string',
          example:
            'refresh_token=eyJhbGc...; Path=/; HttpOnly; SameSite=Lax (dev) or Strict (prod)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failed',
    type: WrappedErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    type: WrappedErrorResponseDto,
  })
  signIn(
    @Request() req: { user: UserDocument },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): AuthResponseDto {
    const { response, refreshToken } = this.authService.signIn(req.user);

    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: this.configService.get('nodeEnv') === 'production', // Visible in dev for debugging
      secure: this.configService.get('nodeEnv') === 'production',
      sameSite:
        this.configService.get('nodeEnv') === 'production' ? 'strict' : 'lax', // Lax for cross-origin dev
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return response;
  }

  @Post('refresh')
  @UseGuards(RefreshTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed successfully')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Uses refresh token from httpOnly cookie to generate new access and refresh tokens. Requires refresh_token cookie.',
  })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({
    status: 200,
    description:
      'Token refreshed successfully. Returns new access token in body and updates refresh_token httpOnly cookie.',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: 'Token refreshed successfully',
            },
            data: { $ref: getSchemaPath(AuthResponseDto) },
          },
        },
      ],
    },
    headers: {
      'Set-Cookie': {
        description: 'Updated refresh_token httpOnly cookie (7 days expiry)',
        schema: {
          type: 'string',
          example:
            'refresh_token=eyJhbGc...; Path=/; HttpOnly; SameSite=Lax (dev) or Strict (prod)',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token',
    type: WrappedErrorResponseDto,
  })
  async refresh(
    @Request() req: { user: { userId: string; email: string } },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const { response, refreshToken } = await this.authService.refreshTokens(
      req.user.userId,
      req.user.email,
    );

    // Set new refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: this.configService.get('nodeEnv') === 'production', // Visible in dev for debugging
      secure: this.configService.get('nodeEnv') === 'production',
      sameSite:
        this.configService.get('nodeEnv') === 'production' ? 'strict' : 'lax', // Lax for cross-origin dev
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out successfully')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the current user by clearing the refresh_token httpOnly cookie. The client should also discard the access token. Requires a valid refresh_token cookie to be present.',
  })
  @ApiResponse({
    status: 200,
    description:
      'User logged out successfully. The refresh_token cookie has been cleared.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Logged out successfully' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - No refresh token found',
    type: WrappedErrorResponseDto,
  })
  logout(
    @Request() req: { cookies: { refresh_token?: string } },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): {
    message: string;
  } {
    // Validate that refresh_token cookie exists
    if (!req.cookies?.refresh_token) {
      throw new HttpException(
        'No refresh token found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Clear the refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: this.configService.get('nodeEnv') === 'production', // Match the cookie settings
      secure: this.configService.get('nodeEnv') === 'production',
      sameSite:
        this.configService.get('nodeEnv') === 'production' ? 'strict' : 'lax', // Match cookie settings
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }
}
