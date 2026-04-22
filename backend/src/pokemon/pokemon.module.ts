import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
// TODO: Crear e importar PokemonGateway aquí
// import { PokemonGateway } from './pokemon.gateway';
import { PokemonController } from './pokemon.controller';

@Module({
  controllers: [PokemonController],
  providers: [
    PokemonService,
    // TODO: Agregar PokemonGateway a providers después de crearlo
    // PokemonGateway,
  ],
  exports: [PokemonService],
})
export class PokemonModule { }
