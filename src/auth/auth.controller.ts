import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Creates a new user account. Per product requirement, the endpoint does
   * not perform login — it returns only the public user profile with 201.
   * Clients should call `/auth/login` afterwards to obtain a JWT.
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   *
   * Validates email/password and returns an access token plus a minimal
   * user profile. Returns 201 on success.
   */
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns JWT access token and user profile' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithCredentials(dto);
  }
}
