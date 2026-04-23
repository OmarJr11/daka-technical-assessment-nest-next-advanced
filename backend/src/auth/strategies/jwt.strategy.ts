import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';

type JwtPayload = {
  sub: number;
  username: string;
};

/**
 * Extracts access token from request cookie header.
 * @param {Request} request - Incoming request
 * @returns {string | null} - Cookie token if present
 */
function extractTokenFromCookie(request: Request): string | null {
  const cookieHeader: string | undefined = request.headers.cookie;
  if (!cookieHeader) {
    return null;
  }
  const cookies: string[] = cookieHeader.split(';');
  for (const cookieEntry of cookies) {
    const [rawKey, ...rawValueParts] = cookieEntry.trim().split('=');
    if (rawKey === 'accessToken') {
      const rawValue: string = rawValueParts.join('=');
      return decodeURIComponent(rawValue);
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    // TODO: Completar configuración de JWT Strategy
    // Requisitos:
    // 1. Obtener el secret desde ConfigService
    // 2. Validar que el secret exista (lanzar error si no)
    // 3. No usar fallback hardcodeado ('secretKey' es inseguro)
    const secret: string | undefined = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request): string | null => extractTokenFromCookie(request),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // TODO: Completar método validate
  // Requisitos:
  // 1. Extraer userId del payload (payload.sub)
  // 2. Buscar usuario en base de datos usando authService.getUserById()
  // 3. Si no existe, lanzar UnauthorizedException
  // 4. Retornar el usuario encontrado
  /**
   * Validate JWT payload
   * @param {JwtPayload} payload - JWT payload
   * @returns {Promise<User>} - User
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
