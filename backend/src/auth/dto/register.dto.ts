import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../decorators/match.decorator';

export class RegisterDto {
  @ApiProperty({
    example: 'user123',
    description: 'The username of the new user',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd123',
    description: 'The password of the new user',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd123',
    description: 'Confirm password',
  })
  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
