import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { Job } from 'bullmq';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { POKEMON_QUEUE_NAME } from './constants/pokemon-queue-name.constant';
import { PokemonRequestJobData } from './interfaces/pokemon-request-job-data.interface';
import { PokemonRequestJobResult } from './interfaces/pokemon-request-job-result.interface';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const POKEAPI_MAX_ID = 898;

type PokeApiResponse = {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
};

/**
 * Processes random pokemon sprite jobs from Redis queue.
 */
@Processor(POKEMON_QUEUE_NAME)
export class PokemonProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(PokemonProcessor.name);
  private readonly storagePath: string = path.resolve(process.cwd(), 'storage');

  /**
   * Process a random sprite request job.
   * @param {Job<PokemonRequestJobData>} job - Queue job payload
   * @returns {Promise<PokemonRequestJobResult>} - Stored sprite metadata
   */
  async process(
    job: Job<PokemonRequestJobData>,
  ): Promise<PokemonRequestJobResult> {
    try {
      await this.ensureStorageDirectoryExists();
      const pokemonId: number = this.generateRandomPokemonId();
      const pokemonData: PokeApiResponse = await this.fetchPokemonData({
        pokemonId,
      });
      const imageUrl: string | null = pokemonData.sprites.front_default;
      if (!imageUrl) {
        throw new Error(`Sprite image not found for pokemon id ${pokemonId}`);
      }
      const imageBuffer: Buffer = await this.fetchImageBuffer({ imageUrl });
      const fileName: string = `${Date.now()}-${pokemonData.id}.png`;
      const filePath: string = path.join(this.storagePath, fileName);
      await writeFile(filePath, imageBuffer);
      this.logger.log(
        `Stored sprite ${fileName} for requester ${job.data.requestedBy}`,
      );
      return {
        userId: job.data.userId,
        pokemonId: pokemonData.id,
        name: pokemonData.name,
        fileName,
      };
    } catch (error) {
      this.logger.error('Failed to process pokemon sprite job', error);
      throw new Error('Could not process pokemon sprite request');
    }
  }

  /**
   * Ensure local storage folder exists before writing files.
   * @returns {Promise<void>} - Promise resolved once directory exists
   */
  private async ensureStorageDirectoryExists(): Promise<void> {
    await mkdir(this.storagePath, { recursive: true });
  }

  /**
   * Generate random id in PokeAPI range.
   * @returns {number} - Random pokemon id
   */
  private generateRandomPokemonId(): number {
    return Math.floor(Math.random() * POKEAPI_MAX_ID) + 1;
  }

  /**
   * Fetch pokemon metadata from PokeAPI.
   * @param {{ pokemonId: number }} params - Request params
   * @returns {Promise<PokeApiResponse>} - Pokemon response
   */
  private async fetchPokemonData(params: {
    pokemonId: number;
  }): Promise<PokeApiResponse> {
    try {
      const { pokemonId } = params;
      const response = await axios.get<PokeApiResponse>(
        `${POKEAPI_BASE_URL}/${pokemonId}`,
      );
      if (
        typeof response.data?.id !== 'number' ||
        typeof response.data?.name !== 'string' ||
        !response.data?.sprites
      ) {
        throw new Error('Invalid PokeAPI response structure');
      }
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch pokemon metadata from PokeAPI', error);
      throw new Error('Could not fetch pokemon metadata');
    }
  }

  /**
   * Download sprite bytes from PokeAPI image URL.
   * @param {{ imageUrl: string }} params - Image request params
   * @returns {Promise<Buffer>} - Sprite image bytes
   */
  private async fetchImageBuffer(params: {
    imageUrl: string;
  }): Promise<Buffer> {
    try {
      const { imageUrl } = params;
      const response = await axios.get<ArrayBuffer>(imageUrl, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to download pokemon sprite image', error);
      throw new Error('Could not download pokemon sprite image');
    }
  }
}
