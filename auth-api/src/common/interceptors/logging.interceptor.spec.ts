import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          url: '/test',
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
        }),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('test')),
    };
  });

  describe('intercept', () => {
    it('should log request with method, url, status code and duration', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(logSpy).toHaveBeenCalled();
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/test 200 - \d+ms/),
          );
          const logMessage = logSpy.mock.calls[0][0] as string;
          expect(logMessage).toMatch(/\d+ms$/);
          done();
        });
    });

    it('should call next.handle() and return its observable', (done) => {
      const testData = { id: 1, name: 'Test' };
      const handleFn = jest.fn().mockReturnValue(of(testData));
      mockCallHandler.handle = handleFn;

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((data) => {
          expect(handleFn).toHaveBeenCalled();
          expect(data).toEqual(testData);
          done();
        });
    });

    it('should handle different HTTP methods and status codes', (done) => {
      const httpContext = mockExecutionContext.switchToHttp();
      (httpContext.getRequest as jest.Mock).mockReturnValue({
        method: 'POST',
        url: '/api/users',
      });
      (httpContext.getResponse as jest.Mock).mockReturnValue({
        statusCode: 201,
      });

      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/POST \/api\/users 201 - \d+ms/),
          );
          done();
        });
    });

    it('should not log when handler throws error', (done) => {
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('Test error')));

      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should measure elapsed time accurately', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      const startTime = Date.now();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          const endTime = Date.now();
          const logMessage = logSpy.mock.calls[0][0] as string;
          const match = logMessage.match(/(\d+)ms$/);

          if (match && match[1]) {
            const loggedTime = parseInt(match[1], 10);
            const actualTime = endTime - startTime;
            expect(loggedTime).toBeGreaterThanOrEqual(0);
            expect(loggedTime).toBeLessThanOrEqual(actualTime + 10);
          }
          done();
        });
    });
  });
});
