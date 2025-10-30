import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class WrappedSuccessResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates success status' })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;

  data: T;
}

export function createWrappedResponseDto<T>(
  classRef: Type<T>,
  description: string = 'Response data',
): Type<WrappedSuccessResponseDto<T>> {
  class WrappedResponse extends WrappedSuccessResponseDto<T> {
    @ApiProperty({ type: classRef, description })
    declare data: T;
  }
  return WrappedResponse;
}

export class WrappedErrorResponseDto {
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
}
