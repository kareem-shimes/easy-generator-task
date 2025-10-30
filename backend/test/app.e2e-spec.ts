import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let accessToken: string;
  let refreshTokenCookie: string;
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'SecurePass123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Get MongoDB connection for cleanup
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

    // Enable cookie parser for httpOnly cookies
    app.use(cookieParser());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Clean up database before tests
    await mongoConnection.dropDatabase();
  });

  afterAll(async () => {
    // Clean up database after tests
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await app.close();
  });

  describe('Authentication', () => {
    describe('POST /auth/signup', () => {
      it('should create a new user with valid data', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('access_token');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.user.email).toBe(testUser.email);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.user.name).toBe(testUser.name);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.user).not.toHaveProperty('password');
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toContain('refresh_token');
          });
      });

      it('should fail with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send(testUser)
          .expect(409);
      });

      it('should fail with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'invalid-email',
            name: 'Test User',
            password: 'SecurePass123!',
          })
          .expect(400);
      });

      it('should fail with short name', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'test2@example.com',
            name: 'Te',
            password: 'SecurePass123!',
          })
          .expect(400);
      });

      it('should fail with weak password', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'test3@example.com',
            name: 'Test User',
            password: 'weak',
          })
          .expect(400);
      });

      it('should fail with password missing special character', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'test4@example.com',
            name: 'Test User',
            password: 'Password123',
          })
          .expect(400);
      });
    });

    describe('POST /auth/signin', () => {
      it('should sign in with valid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('access_token');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toContain('refresh_token');

            // Store tokens for later tests
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            accessToken = res.body.access_token;
            refreshTokenCookie = res.headers['set-cookie'][0];
          });
      });

      it('should fail with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            email: 'wrong@example.com',
            password: testUser.password,
          })
          .expect(401);
      });

      it('should fail with invalid password', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);
      });

      it('should fail with missing credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({})
          .expect(401);
      });
    });

    describe('POST /auth/refresh', () => {
      it('should refresh access token with valid refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', refreshTokenCookie)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('access_token');
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toContain('refresh_token');

            // Update tokens
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            accessToken = res.body.access_token;
            refreshTokenCookie = res.headers['set-cookie'][0];
          });
      });

      it('should fail without refresh token', () => {
        return request(app.getHttpServer()).post('/auth/refresh').expect(401);
      });

      it('should fail with invalid refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', 'refresh_token=invalid_token')
          .expect(401);
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout successfully with refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', refreshTokenCookie)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.message).toBe('Logged out successfully');
          });
      });

      it('should fail without refresh token', () => {
        return request(app.getHttpServer()).post('/auth/logout').expect(401);
      });
    });
  });

  describe('Users', () => {
    // Re-authenticate before user tests
    beforeAll(async () => {
      const res = await request(app.getHttpServer()).post('/auth/signin').send({
        email: testUser.email,
        password: testUser.password,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      accessToken = res.body.access_token;
      refreshTokenCookie = res.headers['set-cookie'][0];
    });

    describe('GET /users/me', () => {
      it('should get current user profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('updatedAt');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.email).toBe(testUser.email);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.name).toBe(testUser.name);
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should fail without authorization token', () => {
        return request(app.getHttpServer()).get('/users/me').expect(401);
      });

      it('should fail with invalid token', () => {
        return request(app.getHttpServer())
          .get('/users/me')
          .set('Authorization', 'Bearer invalid_token')
          .expect(401);
      });
    });

    describe('PATCH /users/me', () => {
      it('should update user profile with valid data', () => {
        const updatedName = 'Updated Test User';
        return request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: updatedName })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('name');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.name).toBe(updatedName);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.email).toBe(testUser.email);
          });
      });

      it('should fail with short name', () => {
        return request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: 'Te' })
          .expect(400);
      });

      it('should fail without authorization token', () => {
        return request(app.getHttpServer())
          .patch('/users/me')
          .send({ name: 'New Name' })
          .expect(401);
      });

      it('should succeed with empty body (no updates)', () => {
        return request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(200);
      });
    });
  });
});
