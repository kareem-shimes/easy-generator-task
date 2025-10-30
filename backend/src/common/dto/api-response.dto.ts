import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponse<T> {
  @ApiProperty({ example: true, description: 'Indicates success status' })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  constructor(message: string, data: T) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class ApiErrorResponse {
  @ApiProperty({ example: false, description: 'Indicates failure status' })
  success: boolean;

  @ApiProperty({
    example: 'An error occurred',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({
    example: 'BadRequestException',
    description: 'Error type',
  })
  error: string;

  constructor(message: string, error: string) {
    this.success = false;
    this.message = message;
    this.error = error;
  }
}
