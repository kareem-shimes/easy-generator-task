import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(() => {
    guard = new LocalAuthGuard();
  });

  it('should extend AuthGuard and delegate to local strategy', async () => {
    expect(guard).toBeInstanceOf(AuthGuard('local'));

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          body: { email: 'test@example.com', password: 'password' },
        }),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    jest
      .spyOn(AuthGuard('local').prototype, 'canActivate')
      .mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
