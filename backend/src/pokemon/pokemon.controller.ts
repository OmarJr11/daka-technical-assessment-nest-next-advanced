import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';

@ApiTags('pokemon')
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stored pokemons' })
  @ApiResponse({ status: 200, description: 'Returns list of pokemons.' })
  findAll() {
    return this.pokemonService.findAll();
  }

  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enqueue a random pokemon sprite request' })
  @ApiResponse({ status: 201, description: 'Request was enqueued.' })
  async getRandomSprite() {
    return this.pokemonService.enqueueRandomSpriteRequest({
      requestedBy: 'http-request',
    });
  }

  @Get('storage/:fileName')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get pokemon sprite image by signed URL' })
  @ApiQuery({ name: 'expires', required: true, type: String })
  @ApiQuery({ name: 'signature', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns sprite file.' })
  getStorageFile(
    @Param('fileName') fileName: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const filePath: string = this.pokemonService.getFilePathFromSignedUrl({
      fileName,
      expires,
      signature,
    });
    const stream = createReadStream(filePath);
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'private, max-age=300');
    return new StreamableFile(stream);
  }

  @Delete('all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete all pokemons' })
  @ApiResponse({ status: 200, description: 'All pokemons deleted.' })
  removeAll() {
    return this.pokemonService.removeAll();
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete a pokemon sprite' })
  @ApiResponse({ status: 200, description: 'Pokemon sprite deleted.' })
  remove(@Param('id') id: string) {
    return this.pokemonService.remove(id);
  }
}
