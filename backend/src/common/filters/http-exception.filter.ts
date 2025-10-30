import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Helper function to get error name from status code
    const getErrorName = (statusCode: number): string => {
      const errorNames: Record<number, string> = {
        [HttpStatus.BAD_REQUEST]: 'BadRequestException',
        [HttpStatus.UNAUTHORIZED]: 'UnauthorizedException',
        [HttpStatus.FORBIDDEN]: 'ForbiddenException',
        [HttpStatus.NOT_FOUND]: 'NotFoundException',
        [HttpStatus.CONFLICT]: 'ConflictException',
        [HttpStatus.INTERNAL_SERVER_ERROR]: 'InternalServerErrorException',
      };
      return errorNames[statusCode] || 'HttpException';
    };

    // Determine the message to use
    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      message = exceptionResponse['message'] as string | string[];
    } else {
      message = 'An error occurred';
    }

    // If message is an array (validation errors), join them
    const errorMessage = Array.isArray(message) ? message.join(', ') : message;

    // Get the error name (exception class name)
    const errorName = exception.constructor.name || getErrorName(status);

    const errorResponse = {
      success: false,
      message: errorMessage,
      error: errorName,
    };

    // Log the error with additional context
    this.logger.error(
      `HTTP ${status} Error: ${errorMessage} | Path: ${request.url} | Method: ${request.method}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
