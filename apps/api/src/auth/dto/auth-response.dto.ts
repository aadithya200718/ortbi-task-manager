import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'User unique UUID' })
  id!: string;

  @ApiProperty({ example: 'Demo User', description: 'Full name' })
  fullName!: string;

  @ApiProperty({ example: 'demo@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: '2026-10-07T00:00:00.000Z', description: 'Registration timestamp' })
  createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: () => UserDto, description: 'Safe user information' })
  user!: UserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT access token',
  })
  accessToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message!: string;
}
