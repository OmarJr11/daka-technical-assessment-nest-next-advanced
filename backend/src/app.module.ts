import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PokemonModule } from './pokemon/pokemon.module';
import typeorm from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
      envFilePath: ['../.env', '.env'],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.getOrThrow('database'),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host: string =
          configService.get<string>('REDIS_HOST') ?? 'localhost';
        const port: number =
          Number(configService.get<string>('REDIS_PORT')) || 6379;
        const password: string | undefined =
          configService.get<string>('REDIS_PASSWORD') || undefined;
        return {
          connection: {
            host,
            port,
            password,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        errorMessage: 'Too many requests',
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL') ?? 120000,
            limit: configService.get<number>('THROTTLE_LIMIT') ?? 20,
          },
        ],
      }),
    }),
    AuthModule,
    PokemonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
