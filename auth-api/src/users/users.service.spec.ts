import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Mock bcrypt
jest.mock('bcrypt');

// Define types for mock methods
interface MockQuery<T> {
  exec: jest.Mock<Promise<T>, []>;
}

interface MockUserModelInstance {
  save: jest.Mock<Promise<UserDocument>, []>;
}

type MockUserModelStatic = {
  new (dto: Partial<UserDocument>): MockUserModelInstance;
  findOne: jest.Mock<MockQuery<UserDocument | null>, [unknown]>;
  findById: jest.Mock<MockQuery<UserDocument | null>, [string]>;
  findByIdAndUpdate: jest.Mock<
    MockQuery<UserDocument | null>,
    [string, UpdateUserDto, { new: boolean }]
  >;
  mockImplementationOnce: jest.MockInstance<
    MockUserModelInstance,
    [Partial<UserDocument>]
  >['mockImplementationOnce'];
};

describe('UsersService', () => {
  let service: UsersService;

  const mockUserId = new Types.ObjectId();
  const mockUserDocument: Partial<UserDocument> = {
    _id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserModel = jest.fn<MockUserModelInstance, [Partial<UserDocument>]>(
    () => ({
      save: jest.fn<Promise<UserDocument>, []>(),
    }),
  ) as unknown as MockUserModelStatic;

  mockUserModel.findOne = jest.fn<MockQuery<UserDocument | null>, [unknown]>();
  mockUserModel.findById = jest.fn<MockQuery<UserDocument | null>, [string]>();
  mockUserModel.findByIdAndUpdate = jest.fn<
    MockQuery<UserDocument | null>,
    [string, UpdateUserDto, { new: boolean }]
  >();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'SecurePass123!',
      };

      const mockSave = jest
        .fn<Promise<UserDocument>, []>()
        .mockResolvedValue(mockUserDocument as UserDocument);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      // Mock the constructor implementation
      mockUserModel.mockImplementationOnce(() => ({
        save: mockSave,
      }));

      await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      const email = 'Test@Example.com';
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(mockUserDocument as UserDocument);
      mockUserModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: email.toLowerCase(),
      });
      expect(result).toEqual(mockUserDocument);
    });

    it('should return null if user not found', async () => {
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userId = mockUserId.toString();
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(mockUserDocument as UserDocument);
      mockUserModel.findById.mockReturnValue({ exec: execMock });

      const result = await service.findById(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserDocument);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(null);
      mockUserModel.findById.mockReturnValue({ exec: execMock });

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
      await expect(service.findById(userId)).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('should update user and return updated document', async () => {
      const userId = mockUserId.toString();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser = { ...mockUserDocument, name: 'Updated Name' };
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(updatedUser as UserDocument);
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(userId, updateUserDto);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found during update', async () => {
      const userId = 'non-existent-id';
      const updateUserDto: UpdateUserDto = {
        name: 'New Name',
      };

      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const password = 'correct-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(
        mockUserDocument as UserDocument,
        password,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        mockUserDocument.password,
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const password = 'wrong-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(
        mockUserDocument as UserDocument,
        password,
      );

      expect(result).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return user entity for valid user id', async () => {
      const userId = mockUserId.toString();
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(mockUserDocument as UserDocument);
      mockUserModel.findById.mockReturnValue({ exec: execMock });

      const result = await service.getProfile(userId);

      expect(result).toEqual({
        _id: mockUserId.toString(),
        email: mockUserDocument.email,
        name: mockUserDocument.name,
        createdAt: mockUserDocument.createdAt,
        updatedAt: mockUserDocument.updatedAt,
      });
    });

    it('should throw NotFoundException for invalid user id', async () => {
      const userId = 'invalid-id';
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(null);
      mockUserModel.findById.mockReturnValue({ exec: execMock });

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return user entity', async () => {
      const userId = mockUserId.toString();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser = { ...mockUserDocument, name: 'Updated Name' };
      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(updatedUser as UserDocument);
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.updateProfile(userId, updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException for invalid user id', async () => {
      const userId = 'invalid-id';
      const updateUserDto: UpdateUserDto = {
        name: 'New Name',
      };

      const execMock = jest
        .fn<Promise<UserDocument | null>, []>()
        .mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      await expect(
        service.updateProfile(userId, updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toUserEntity', () => {
    it('should convert UserDocument to UserEntity without password', () => {
      const result = service.toUserEntity(mockUserDocument as UserDocument);

      expect(result).toEqual({
        _id: mockUserId.toString(),
        email: mockUserDocument.email,
        name: mockUserDocument.name,
        createdAt: mockUserDocument.createdAt,
        updatedAt: mockUserDocument.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
      expect(typeof result._id).toBe('string');
    });
  });
});
