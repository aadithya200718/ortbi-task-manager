import { MaxUtf8Bytes } from '../../common/validators/max-utf8-bytes.validator';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Demo User',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'Full name cannot be empty' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'demo@example.com',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 72,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password cannot exceed 72 characters' })
  @MaxUtf8Bytes(72, { message: 'Password cannot exceed 72 UTF-8 bytes' })
  password!: string;
}
