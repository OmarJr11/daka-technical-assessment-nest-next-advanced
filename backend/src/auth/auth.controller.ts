import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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
  async login(@Body() loginDto: LoginDto) {
    // TODO: Implementar lógica de login
    throw new Error('Method not implemented - Complete this functionality');
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // TODO: Implementar protección con JWT Guard
  // Esta ruta debe estar protegida y solo accesible con token válido
  @Get('me')
  // TODO: Descomentar y configurar el guard
  // @UseGuards(AuthGuard('jwt'))
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Request() req) {
    // TODO: Una vez implementado el guard, retornar req.user
    throw new Error('Method not implemented - Implement JWT guard first');
  }
}

