import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents authentication credentials used in login requests.
 */
export class LoginDto {
  @ApiProperty({
    example: 'user123',
    description: 'The username of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscores',
  })
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
