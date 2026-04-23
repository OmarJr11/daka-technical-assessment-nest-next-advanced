import {
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Request,
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
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import { User } from '../auth/entities/user.entity';

type AuthenticatedRequest = {
  user: User;
};

@ApiTags('pokemon')
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stored pokemons' })
  @ApiResponse({ status: 200, description: 'Returns list of pokemons.' })
  async findAll(@Request() req: AuthenticatedRequest) {
    try {
      return await this.pokemonService.findAll({ userId: req.user.id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not fetch pokemon sprites');
    }
  }

  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enqueue a random pokemon sprite request' })
  @ApiResponse({ status: 201, description: 'Request was enqueued.' })
  async getRandomSprite(@Request() req: AuthenticatedRequest) {
    try {
      return await this.pokemonService.enqueueRandomSpriteRequest({
        userId: req.user.id,
        requestedBy: 'http-request',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Could not enqueue pokemon sprite request',
      );
    }
  }

  @Get('storage/:fileName')
  @SkipThrottle()
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
  async removeAll(@Request() req: AuthenticatedRequest) {
    try {
      return await this.pokemonService.removeAll({ userId: req.user.id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not delete all sprites');
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete a pokemon sprite' })
  @ApiResponse({ status: 200, description: 'Pokemon sprite deleted.' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    try {
      return await this.pokemonService.remove({
        userId: req.user.id,
        id,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not delete sprite');
    }
  }
}
