import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for user registration.
 *
 * Validation is enforced globally by `ValidationPipe`.
 */
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
