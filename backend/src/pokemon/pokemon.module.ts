import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { PokemonProcessor } from './pokemon.processor';
import { POKEMON_QUEUE_NAME } from './constants/pokemon-queue-name.constant';
import { AuthModule } from '../auth/auth.module';
import { PokemonQueueEventsListener } from './pokemon.queue-events.listener';
import { PokemonGateway } from './pokemon.gateway';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: POKEMON_QUEUE_NAME,
    }),
  ],
  controllers: [PokemonController],
  providers: [
    PokemonService,
    PokemonGateway,
    PokemonProcessor,
    PokemonQueueEventsListener,
  ],
  exports: [PokemonService],
})
export class PokemonModule {}
