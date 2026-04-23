import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { POKEMON_QUEUE_NAME } from './constants/pokemon-queue-name.constant';
import { PokemonRequestJobResult } from './interfaces/pokemon-request-job-result.interface';
import { PokemonGateway } from './pokemon.gateway';
import { PokemonService } from './pokemon.service';

/**
 * Listens queue events and emits websocket updates.
 */
@QueueEventsListener(POKEMON_QUEUE_NAME)
export class PokemonQueueEventsListener extends QueueEventsHost {
  private readonly logger: Logger = new Logger(PokemonQueueEventsListener.name);

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly pokemonGateway: PokemonGateway,
  ) {
    super();
  }

  /**
   * Emit sprite event when processing completes.
   * @param {{ jobId: string; returnvalue: unknown }} params - Completed payload
   * @returns {void} - No return
   */
  @OnQueueEvent('completed')
  onCompleted(params: { jobId: string; returnvalue: unknown }): void {
    const result: PokemonRequestJobResult | null = this.parseJobResult({
      returnvalue: params.returnvalue,
    });
    if (!result) {
      this.logger.warn(`Job ${params.jobId} completed without valid result`);
      this.pokemonGateway.emitSpriteError({
        jobId: params.jobId,
        message: 'Sprite processing produced an invalid result',
      });
      return;
    }
    const spriteResponse = this.pokemonService.registerProcessedSprite({
      result,
    });
    this.pokemonGateway.emitSpriteServed(spriteResponse);
  }

  /**
   * Emit websocket error when queue processing fails.
   * @param {{ jobId: string; failedReason: string }} params - Failed payload
   * @returns {void} - No return
   */
  @OnQueueEvent('failed')
  onFailed(params: { jobId: string; failedReason: string }): void {
    this.logger.error(`Job ${params.jobId} failed: ${params.failedReason}`);
    this.pokemonGateway.emitSpriteError({
      jobId: params.jobId,
      message: params.failedReason || 'Failed to process sprite',
    });
  }

  /**
   * Parse queue returnvalue into typed result.
   * @param {{ returnvalue: unknown }} params - Queue payload
   * @returns {PokemonRequestJobResult | null} - Parsed result
   */
  private parseJobResult(params: {
    returnvalue: unknown;
  }): PokemonRequestJobResult | null {
    try {
      const { returnvalue } = params;
      if (!returnvalue) {
        return null;
      }
      const rawValue: unknown =
        typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;
      if (typeof rawValue !== 'object' || rawValue === null) {
        return null;
      }
      const candidate = rawValue as Partial<PokemonRequestJobResult>;
      if (
        typeof candidate.pokemonId !== 'number' ||
        typeof candidate.name !== 'string' ||
        typeof candidate.fileName !== 'string'
      ) {
        return null;
      }
      return {
        pokemonId: candidate.pokemonId,
        name: candidate.name,
        fileName: candidate.fileName,
      };
    } catch {
      this.logger.warn('Failed to parse queue job result payload');
      return null;
    }
  }
}
