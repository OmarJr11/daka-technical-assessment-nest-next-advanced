import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'user123',
        description: 'The username of the user',
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        example: 'password123',
        description: 'The password of the user',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
