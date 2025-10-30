import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
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
          success: false,
          message: 'Test error',
          error: 'HttpException',
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

    it('should include error name based on exception type', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const calls = mockJson.mock.calls as Array<[ErrorResponse]>;
      const callArg = calls[0][0];
      expect(callArg.error).toBeDefined();
      expect(typeof callArg.error).toBe('string');
      expect(callArg.error).toBe('HttpException');
    });

    it('should set correct status code', () => {
      mockGetRequest.mockReturnValue({
        url: '/api/users/123',
        method: 'DELETE',
      });

      const exception = new HttpException('Test', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Test',
          error: 'HttpException',
        }),
      );
    });

    it('should use default message when response has no message', () => {
      const exception = new HttpException(
        { statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An error occurred',
          success: false,
        }),
      );
    });
  });
});
