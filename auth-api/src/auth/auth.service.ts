import {
  Injectable,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user and return JWT tokens
   */
  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const existingUser = await this.usersService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(signUpDto);
    this.logger.log(`New user created: ${user.email}`);

    return this.generateAuthResponse(user);
  }

  /**
   * Validate user credentials (used by LocalStrategy)
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await this.usersService.validatePassword(user, password))) {
      return user;
    }
    return null;
  }

  /**
   * Sign in an authenticated user and return JWT tokens
   * This is called after LocalStrategy validates credentials
   */
  signIn(user: UserDocument): {
    response: AuthResponseDto;
    refreshToken: string;
  } {
    return this.generateAuthResponse(user);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(
    userId: string,
    email: string,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.logger.log(`Tokens refreshed for user: ${email}`);
      return this.generateAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate JWT tokens and build auth response for authenticated user
   * This is a private helper used by both signUp and signIn flows
   */
  private generateAuthResponse(user: UserDocument): {
    response: AuthResponseDto;
    refreshToken: string;
  } {
    const userId = (user._id as Types.ObjectId).toString();
    const payload = {
      email: user.email,
      sub: userId,
    };

    // Generate access token (uses default JWT module config)
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token with different secret and expiration
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
    ) as JwtSignOptions['expiresIn'];

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    this.logger.log(`User authenticated: ${user.email}`);

    return {
      response: {
        user: this.usersService.toUserEntity(user),
        access_token: accessToken,
      },
      refreshToken,
    };
  }
}
