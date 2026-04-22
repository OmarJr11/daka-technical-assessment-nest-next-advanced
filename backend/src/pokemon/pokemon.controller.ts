import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('pokemon')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('pokemon')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) { }

    @Get()
    @ApiOperation({ summary: 'Get all stored pokemons' })
    @ApiResponse({ status: 200, description: 'Returns list of pokemons.' })
    findAll() {
        return this.pokemonService.findAll();
    }

    async getRandom() {
        return { url: await this.pokemonService.getRandomSprite() };
    }

    @Delete('all')
    @ApiOperation({ summary: 'Delete all pokemons' })
    @ApiResponse({ status: 200, description: 'All pokemons deleted.' })
    removeAll() {
        return this.pokemonService.removeAll();
    }


    @Delete(':id')
    @ApiOperation({ summary: 'Delete a pokemon sprite' })
    @ApiResponse({ status: 200, description: 'Pokemon sprite deleted.' })
    remove(@Param('id') id: string) {
        return this.pokemonService.remove(+id);
    }
}
