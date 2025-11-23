import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for login endpoint.
 * Validates basic credentials payload.
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
