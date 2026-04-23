import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret: string | undefined =
          configService.get<string>('JWT_SECRET');
        const expirationTime: StringValue =
          configService.get<StringValue>('JWT_EXPIRATION_TIME') ?? '1h';
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: expirationTime,
            algorithm: 'HS256' as const,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, JwtStrategy, PassportModule],
})
export class AuthModule {}
