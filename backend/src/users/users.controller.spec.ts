import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { Types } from 'mongoose';

interface MockAuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

describe('UsersController', () => {
  let controller: UsersController;

  const mockUserId = new Types.ObjectId().toString();
  const mockUserEntity: UserEntity = {
    _id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockRequest: MockAuthRequest = {
        user: {
          userId: mockUserId,
          email: 'test@example.com',
        },
      };

      mockUsersService.getProfile.mockResolvedValue(mockUserEntity);

      const result = await controller.getProfile(mockRequest);

      expect(mockUsersService.getProfile).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserEntity);
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockRequest: MockAuthRequest = {
        user: {
          userId: 'non-existent-id',
          email: 'test@example.com',
        },
      };

      mockUsersService.getProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockRequest: MockAuthRequest = {
        user: {
          userId: mockUserId,
          email: 'test@example.com',
        },
      };

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser: UserEntity = {
        ...mockUserEntity,
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        mockUserId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found during update', async () => {
      const mockRequest: MockAuthRequest = {
        user: {
          userId: 'non-existent-id',
          email: 'test@example.com',
        },
      };

      const updateUserDto: UpdateUserDto = {
        name: 'New Name',
      };

      mockUsersService.updateProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateProfile(mockRequest, updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
