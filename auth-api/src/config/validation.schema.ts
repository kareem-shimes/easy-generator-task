import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

export class EnvironmentVariables {
  // Database
  @IsString()
  @IsNotEmpty()
  MONGODB_URI: string;

  // JWT
  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long',
  })
  JWT_SECRET: string;

  @IsString()
  @Matches(/^\d+[smhdwy]$/, {
    message:
      'JWT_EXPIRES_IN must be a valid time string (e.g., 1h, 30m, 7d, 1y)',
  })
  @Transform(({ value }: { value: string }) => value || '1h')
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters long',
  })
  JWT_REFRESH_SECRET: string;

  @IsString()
  @Matches(/^\d+[smhdwy]$/, {
    message:
      'JWT_REFRESH_EXPIRES_IN must be a valid time string (e.g., 1h, 30m, 7d, 1y)',
  })
  @Transform(({ value }: { value: string }) => value || '7d')
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // Application
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(
    ({ value }: { value: string }) => parseInt(String(value), 10) || 3000,
  )
  PORT: number = 3000;

  @IsEnum(Environment)
  @Transform(({ value }: { value: string }) => value || 'development')
  NODE_ENV: Environment = Environment.Development;

  // Logging
  @IsEnum(LogLevel)
  @Transform(({ value }: { value: string }) => value || 'info')
  LOG_LEVEL: LogLevel = LogLevel.Info;

  // CORS
  @IsString()
  @Transform(({ value }: { value: string }) => value || '*')
  CORS_ORIGIN: string = '*';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
