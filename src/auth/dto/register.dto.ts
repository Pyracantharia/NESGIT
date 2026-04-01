import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "The email of the user",
    example: "test@example.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "The password of the user", example: "password" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: "The username of the user", example: "testuser" })
  @IsString()
  username!: string;

  @ApiProperty({ description: "The color of the user", example: "#ff0000" })
  @IsString()
  color!: string;
}
