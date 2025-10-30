import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  errors?: string[];
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    mockGetRequest = jest.fn().mockReturnValue({
      url: '/test-url',
      method: 'GET',
    });
    mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });

    mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  describe('catch', () => {
    it('should format error response with all required fields', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: expect.any(String) as string,
          path: '/test-url',
          method: 'GET',
          message: 'Test error',
        }),
      );
    });

    it('should handle exception with object response', () => {
      const exceptionResponse = {
        message: 'Validation failed',
        errors: ['field1 is required'],
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        }),
      );
    });

    it('should handle exception with string response', () => {
      const exception = new HttpException(
        'Simple error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Simple error',
        }),
      );
    });

    it('should include timestamp in ISO format', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const calls = mockJson.mock.calls as Array<[ErrorResponse]>;
      const callArg = calls[0][0];
      expect(callArg.timestamp).toBeDefined();
      expect(typeof callArg.timestamp).toBe('string');
      const timestampDate = new Date(callArg.timestamp);
      expect(timestampDate.toISOString()).toBe(callArg.timestamp);
    });

    it('should include request path and method from context', () => {
      mockGetRequest.mockReturnValue({
        url: '/api/users/123',
        method: 'DELETE',
      });

      const exception = new HttpException('Test', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
          method: 'DELETE',
          statusCode: HttpStatus.FORBIDDEN,
        }),
      );
    });

    it('should use exception message as fallback when response has no message', () => {
      const exception = new HttpException(
        { statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Bad Request',
        }),
      );
    });
  });
});
