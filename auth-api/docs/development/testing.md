# Testing Guide

## Overview

This guide covers testing strategies, tools, and best practices for the EasyGenerator Authentication API.

## Testing Stack

- **Framework**: Jest
- **Test Runner**: Jest with ts-jest
- **E2E Testing**: Supertest
- **Coverage**: Istanbul (via Jest)
- **Mocking**: Jest mocking utilities

## Test Types

### 1. Unit Tests

Test individual functions, methods, and classes in isolation.

**Location**: `*.spec.ts` files next to source files

**Example**:
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should hash password on signup', async () => {
    const dto = { email: 'test@test.com', name: 'Test', password: 'Pass123!' };
    jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
    
    await service.signup(dto);
    
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.not.stringContaining('Pass123!'),
      }),
    );
  });
});
```

### 2. Integration Tests

Test multiple components working together.

**Example**:
```typescript
describe('AuthController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/signup (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'test@test.com', name: 'Test', password: 'Pass123!' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });
});
```

### 3. E2E Tests

Test complete user flows through the API.

**Location**: `test/` directory

**Example**:
```typescript
describe('Authentication Flow (e2e)', () => {
  it('should complete full signup and signin flow', async () => {
    // Signup
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'user@test.com', name: 'User', password: 'Pass123!' })
      .expect(201);

    const accessToken = signupRes.body.access_token;
    const cookies = signupRes.headers['set-cookie'];

    // Access protected route
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Refresh token
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    expect(refreshRes.body).toHaveProperty('access_token');
    expect(refreshRes.headers['set-cookie']).toBeDefined();

    // Logout
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookies)
      .expect(200);
  });
});
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Watch Mode
```bash
pnpm run test:watch
```

### Coverage Report
```bash
pnpm run test:cov
```

### E2E Tests
```bash
pnpm run test:e2e
```

### Specific Test File
```bash
pnpm test -- auth.service.spec.ts
```

## Test Database

Use separate test database:

```bash
# .env.test
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth-test
```

Clean database between tests:
```typescript
afterEach(async () => {
  await userModel.deleteMany({});
});
```

## Coverage Goals

Target coverage:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

View coverage report:
```bash
pnpm run test:cov
open coverage/lcov-report/index.html
```

## Best Practices

1. **Test naming**: Use descriptive names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock external dependencies**: Database, APIs
4. **Clean up**: Reset state between tests
5. **Test edge cases**: Error scenarios, validation
6. **Keep tests fast**: Use mocks, in-memory DB

## CI/CD Integration

Tests run automatically on:
- Every push to feature branches
- Pull requests
- Before deployment

GitHub Actions example:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Run tests
  run: pnpm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Debugging Tests

### VS Code
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### CLI
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Utilities

Common test helpers:

```typescript
// Create test user
export const createTestUser = async () => {
  return await userModel.create({
    email: 'test@test.com',
    name: 'Test User',
    password: await bcrypt.hash('Pass123!', 10),
  });
};

// Generate test JWT
export const generateTestToken = (userId: string) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET);
};
```
