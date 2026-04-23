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
import { POKEMON_RESPONSE_MESSAGE } from './constants/pokemon-response-message.constant';

type AuthenticatedRequest = {
  user: User;
};

/**
 * Exposes pokemon HTTP endpoints and delegates business logic to services.
 */
@ApiTags('pokemon')
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * Return all sprites for the authenticated user.
   * @param {AuthenticatedRequest} req - Request with authenticated user
   * @returns {Promise<unknown>} User sprite list
   */
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
      throw new InternalServerErrorException(
        POKEMON_RESPONSE_MESSAGE.fetchSpritesFailed,
      );
    }
  }

  /**
   * Enqueue one random sprite request for the authenticated user.
   * @param {AuthenticatedRequest} req - Request with authenticated user
   * @returns {Promise<{ jobId: string }>} Enqueued job reference
   */
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
        POKEMON_RESPONSE_MESSAGE.enqueueRequestFailed,
      );
    }
  }

  /**
   * Serve one sprite file using signed URL parameters.
   * @param {string} fileName - Storage file name
   * @param {string} expires - Signed URL expiration timestamp
   * @param {string} signature - Signed URL hash signature
   * @param {Response} response - Express response object
   * @returns {StreamableFile} Streamable sprite image
   */
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

  /**
   * Delete all sprites for the authenticated user.
   * @param {AuthenticatedRequest} req - Request with authenticated user
   * @returns {Promise<{ deleted: boolean; count: number }>} Deletion result
   */
  @Delete('all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all pokemons' })
  @ApiResponse({ status: 200, description: 'All pokemons deleted.' })
  async removeAll(@Request() req: AuthenticatedRequest) {
    try {
      return await this.pokemonService.removeAll({ userId: req.user.id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        POKEMON_RESPONSE_MESSAGE.deleteAllFailed,
      );
    }
  }

  /**
   * Delete one sprite for the authenticated user.
   * @param {AuthenticatedRequest} req - Request with authenticated user
   * @param {string} id - Sprite id
   * @returns {Promise<{ deleted: boolean; id: string }>} Deletion result
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
      throw new InternalServerErrorException(
        POKEMON_RESPONSE_MESSAGE.deleteOneFailed,
      );
    }
  }
}
