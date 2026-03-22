import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'The password of the user', example: 'password' })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password!: string;
  @ApiProperty({ description: 'The username of the user', example: 'testuser' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ description: 'The color of the user', example: '#ff0000' })
  @IsString()
  color!: string;
}
