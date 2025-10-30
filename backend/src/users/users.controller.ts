import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WrappedErrorResponseDto } from '../common/dto/wrapped-response.dto';

@ApiTags('users')
@ApiExtraModels(UserEntity, WrappedErrorResponseDto)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('User profile retrieved successfully')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: 'User profile retrieved successfully',
            },
            data: { $ref: getSchemaPath(UserEntity) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WrappedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: WrappedErrorResponseDto,
  })
  async getProfile(
    @Request() req: { user: { userId: string; email: string } },
  ): Promise<UserEntity> {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User profile updated successfully')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: 'User profile updated successfully',
            },
            data: { $ref: getSchemaPath(UserEntity) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: WrappedErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WrappedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: WrappedErrorResponseDto,
  })
  async updateProfile(
    @Request() req: { user: { userId: string; email: string } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfile(req.user.userId, updateUserDto);
  }
}
