import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MaxUtf8Bytes } from '../../common/validators/max-utf8-bytes.validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address',
    example: 'demo@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    description: 'Account password (maximum 72 UTF-8 bytes)',
    example: 'SecurePassword123!',
    maxLength: 72,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MaxUtf8Bytes(72, { message: 'Password cannot exceed 72 UTF-8 bytes' })
  password!: string;
}
