import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { User } from './entities/user.entity';
import { Throttle } from '@nestjs/throttler';

type AuthenticatedRequest = {
  user: User;
};

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: Completar implementación del login
  // Requisitos:
  // 1. Validar usuario usando authService.validateUser()
  // 2. Si las credenciales son inválidas, lanzar UnauthorizedException
  // 3. Si son válidas, retornar el resultado de authService.login()
  // 4. Agregar manejo de errores apropiado (try/catch)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Return access token.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: User }> {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    const authResult = await this.authService.login(user);
    this.setAuthCookie(response, authResult.accessToken);
    return { user: authResult.user };
  }

  /**
   * Register a new user
   * @param {RegisterDto} registerDto - Register user dto
   */
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User registered with access token.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return await this.authService.register(registerDto);
  }

  /**
   * Logs out the current user by clearing auth cookie.
   * @param {Response} response - Express response
   * @returns {{message: string}} Logout response message
   */
  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User logged out successfully.' })
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    this.clearAuthCookie(response);
    return { message: 'Logged out successfully' };
  }

  // TODO: Implementar protección con JWT Guard
  // Esta ruta debe estar protegida y solo accesible con token válido
  /**
   * Get current user profile
   * @param {AuthenticatedRequest} req - Authenticated request
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return await this.authService.getProfile(req.user);
  }

  /**
   * Sets signed-in token as http-only cookie.
   * @param {Response} response - Express response
   * @param {string} accessToken - JWT access token
   */
  private setAuthCookie(response: Response, accessToken: string): void {
    const isProduction: boolean = process.env.NODE_ENV === 'production';
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
  }

  /**
   * Clears auth cookie in logout flow.
   * @param {Response} response - Express response
   */
  private clearAuthCookie(response: Response): void {
    const isProduction: boolean = process.env.NODE_ENV === 'production';
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });
  }
}
