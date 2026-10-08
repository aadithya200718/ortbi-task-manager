import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP Status code' })
  statusCode!: number;

  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Error category code' })
  code!: string;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Human-readable error message or list of messages',
  })
  message!: string | string[];

  @ApiProperty({ example: '2026-10-07T00:00:00.000Z', description: 'Timestamp of the error' })
  timestamp!: string;

  @ApiProperty({ example: '/api/projects', description: 'Endpoint path that produced the error' })
  path!: string;
}
