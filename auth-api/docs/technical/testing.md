# Testing Documentation

## Overview

This document describes the unit testing strategy for the EasyGenerator Auth API. All tests are written using Jest and follow NestJS testing best practices.

## Test Coverage

### Authentication Module (`src/auth/`)

#### AuthController Tests (`auth.controller.spec.ts`) - 13 tests
- **signUp**
  - ✅ Creates new user and returns auth response
  - ✅ Sets secure cookie in production environment
  - ✅ Handles user already exists error
  
- **signIn**
  - ✅ Signs in user and returns auth response
  - ✅ Sets refresh token as httpOnly cookie
  
- **refresh**
  - ✅ Refreshes tokens and returns new auth response
  - ✅ Handles invalid refresh token error
  
- **logout**
  - ✅ Clears refresh token cookie when valid token exists
  - ✅ Returns success message
  - ✅ Validates refresh token cookie exists before logout
  - ✅ Throws UnauthorizedException if no cookie present

#### AuthService Tests (`auth.service.spec.ts`)
- **signUp**
  - ✅ Creates new user and returns JWT tokens
  - ✅ Throws ConflictException if user already exists
  - ✅ Generates both access and refresh tokens with correct payloads
  
- **validateUser**
  - ✅ Returns user if credentials are valid
  - ✅ Returns null if user not found
  - ✅ Returns null if password is invalid
  
- **signIn**
  - ✅ Returns tokens for authenticated user
  
- **refreshTokens**
  - ✅ Generates new tokens for valid user
  - ✅ Throws UnauthorizedException if user not found
  - ✅ Throws UnauthorizedException on database error

### Users Module (`src/users/`)

#### UsersController Tests (`users.controller.spec.ts`)
- **getProfile**
  - ✅ Returns user profile for authenticated user
  - ✅ Throws NotFoundException if user not found
  - ✅ Uses userId from JWT token
  
- **updateProfile**
  - ✅ Updates user profile successfully
  - ✅ Handles empty update DTO
  - ✅ Only updates provided fields

#### UsersService Tests (`users.service.spec.ts`)
- **create**
  - ✅ Creates new user with hashed password
  - ✅ Uses bcrypt with salt round of 10
  
- **findByEmail**
  - ✅ Finds user by email (case-insensitive)
  - ✅ Returns null if user not found
  - ✅ Converts email to lowercase
- **findById**
  - ✅ Finds user by ID
  - ✅ Throws NotFoundException if user not found
  
- **update**
  - ✅ Updates user and returns updated document
  - ✅ Throws NotFoundException if user not found
  - ✅ Returns new document after update
  
- **validatePassword**
  - ✅ Returns true for valid password
  - ✅ Returns false for invalid password
  
- **getProfile**
  - ✅ Returns user entity for valid user ID
  - ✅ Throws NotFoundException for invalid user ID
  
- **updateProfile**
  - ✅ Updates and returns user entity
  - ✅ Throws NotFoundException for invalid user ID
  
- **toUserEntity**
  - ✅ Converts UserDocument to UserEntity without password
  - ✅ Converts ObjectId to string
  - ✅ Includes all required fields except password

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with coverage
```bash
pnpm test:cov
```

### Debug tests
```bash
pnpm test:debug
```

## Test Structure

All test files follow the NestJS testing pattern:

```typescript
describe('ComponentName', () => {
  let component: ComponentType;
  let dependency: DependencyType;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // Module configuration
    }).compile();

    component = module.get<ComponentType>(ComponentType);
    dependency = module.get<DependencyType>(DependencyType);
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Mocking Strategy

### Controllers
- Mock all service dependencies
- Mock Express request/response objects
- Test HTTP-specific behavior (cookies, status codes)

### Services
- Mock external dependencies (repositories, other services)
- Test business logic in isolation
- Mock bcrypt for password hashing/comparison
- Mock JwtService for token generation

### Best Practices
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Clear mocks**: Use `jest.clearAllMocks()` in `beforeEach`
3. **Descriptive names**: Test names should describe expected behavior
4. **Single responsibility**: Each test should verify one thing
5. **Mock external dependencies**: Don't test MongoDB, JWT, or bcrypt directly

## Coverage Goals

Current coverage:
- **AuthController**: 100% statements, 75% branches
- **AuthService**: 100% statements, 85% branches
- **UsersController**: 100% statements, 75% branches
- **UsersService**: 100% statements, 87.5% branches

Target: Maintain >80% coverage for all business logic.

## Future Improvements

1. Add integration tests for full request/response cycles
2. Add E2E tests for critical user flows
3. Add tests for guards and strategies
4. Add tests for exception filters and interceptors
5. Add performance/load tests for authentication endpoints
