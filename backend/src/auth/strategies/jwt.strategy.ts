import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

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
        const secret = configService.get<string>('JWT_SECRET');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret || 'secretKey',  // TODO: Eliminar fallback y validar secret
        });
    }

    // TODO: Completar método validate
    // Requisitos:
    // 1. Extraer userId del payload (payload.sub)
    // 2. Buscar usuario en base de datos usando authService.getUserById()
    // 3. Si no existe, lanzar UnauthorizedException
    // 4. Retornar el usuario encontrado
    async validate(payload: any) {
        // TODO: Implementar validación del JWT payload
        throw new Error('Method not implemented - Complete JWT validation');
    }
}
