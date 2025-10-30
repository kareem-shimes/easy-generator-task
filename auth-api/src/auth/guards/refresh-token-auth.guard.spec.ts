import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenAuthGuard } from './refresh-token-auth.guard';

describe('RefreshTokenAuthGuard', () => {
  let guard: RefreshTokenAuthGuard;

  beforeEach(() => {
    guard = new RefreshTokenAuthGuard();
  });

  it('should extend AuthGuard and delegate to jwt-refresh strategy', async () => {
    expect(guard).toBeInstanceOf(AuthGuard('jwt-refresh'));

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          cookies: { refresh_token: 'valid-refresh-token' },
        }),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    jest
      .spyOn(AuthGuard('jwt-refresh').prototype, 'canActivate')
      .mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
