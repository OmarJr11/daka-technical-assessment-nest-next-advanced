import {
  BadRequestException,
  GoneException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import * as path from 'node:path';
import { POKEMON_QUEUE_NAME } from './constants/pokemon-queue-name.constant';
import { POKEMON_REQUEST_JOB_NAME } from './constants/pokemon-request-job-name.constant';
import { PokemonRequestJobData } from './interfaces/pokemon-request-job-data.interface';
import { PokemonRequestJobResult } from './interfaces/pokemon-request-job-result.interface';
import { PokemonSpriteRecord } from './interfaces/pokemon-sprite-record.interface';
import { PokemonSpriteResponse } from './interfaces/pokemon-sprite-response.interface';

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;
const STORAGE_FILE_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const USER_SPRITES_REDIS_KEY_PREFIX = 'pokemon:sprites:user';

/**
 * Handles pokemon sprite queue operations and signed storage access.
 */
@Injectable()
export class PokemonService implements OnModuleDestroy {
  private readonly logger: Logger = new Logger(PokemonService.name);
  private readonly storagePath: string = path.resolve(process.cwd(), 'storage');
  private readonly storageSecretKey: string;
  private readonly redisClient: Redis;

  constructor(
    @InjectQueue(POKEMON_QUEUE_NAME)
    private readonly pokemonQueue: Queue<
      PokemonRequestJobData,
      PokemonRequestJobResult
    >,
  ) {
    const secretKey: string | undefined = process.env.STORAGE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STORAGE_SECRET_KEY is required');
    }
    const redisHost: string = process.env.REDIS_HOST || 'localhost';
    const redisPort: number = Number(process.env.REDIS_PORT) || 6379;
    const redisPassword: string | undefined =
      process.env.REDIS_PASSWORD || undefined;
    this.storageSecretKey = secretKey;
    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    });
  }

  /**
   * Enqueue random sprite request into Redis queue.
   * @param {{ userId: number; requestedBy: string }} params - Queue request params
   * @returns {Promise<{ jobId: string }>} - Queue job identifier
   */
  async enqueueRandomSpriteRequest(params: {
    userId: number;
    requestedBy: string;
  }): Promise<{ jobId: string }> {
    const { userId, requestedBy } = params;
    try {
      const job = await this.pokemonQueue.add(
        POKEMON_REQUEST_JOB_NAME,
        { userId, requestedBy },
        {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: 30,
        },
      );
      this.logger.log(`Enqueued pokemon sprite request by ${requestedBy}`);
      return {
        jobId: String(job.id),
      };
    } catch (error) {
      this.logger.error('Failed to enqueue pokemon sprite request', error);
      throw new InternalServerErrorException(
        'Unable to enqueue pokemon sprite request',
      );
    }
  }

  /**
   * Save processed sprite metadata and return signed access URL.
   * @param {{ result: PokemonRequestJobResult }} params - Processor result
   * @returns {Promise<PokemonSpriteResponse>} - Signed sprite response
   */
  async registerProcessedSprite(params: {
    result: PokemonRequestJobResult;
  }): Promise<PokemonSpriteResponse> {
    const { result } = params;
    const spriteRecord: PokemonSpriteRecord = {
      id: this.generateSpriteRecordId(),
      pokemonId: result.pokemonId,
      name: result.name,
      fileName: result.fileName,
      createdAt: Date.now(),
    };
    await this.saveUserSprites({
      userId: result.userId,
      records: [
        spriteRecord,
        ...(await this.getUserSpriteRecords({ userId: result.userId })),
      ],
    });
    return this.toSpriteResponse({ record: spriteRecord });
  }

  /**
   * Return all stored sprites for one user with refreshed signed URLs.
   * @param {{ userId: number }} params - User filter params
   * @returns {Promise<PokemonSpriteResponse[]>} - Sprite list
   */
  async findAll(params: { userId: number }): Promise<PokemonSpriteResponse[]> {
    const records: PokemonSpriteRecord[] = await this.getUserSpriteRecords({
      userId: params.userId,
    });
    return records.map((record) => this.toSpriteResponse({ record }));
  }

  /**
   * Resolve signed URL parameters to a safe local storage path.
   * @param {{ fileName: string; expires: string; signature: string }} params - Signed URL params
   * @returns {string} - Absolute local file path
   */
  getFilePathFromSignedUrl(params: {
    fileName: string;
    expires: string;
    signature: string;
  }): string {
    const { fileName, expires, signature } = params;
    if (!STORAGE_FILE_NAME_PATTERN.test(fileName)) {
      throw new BadRequestException('Invalid storage file name');
    }
    const expiresAt: number = Number(expires);
    if (!Number.isFinite(expiresAt)) {
      throw new BadRequestException('Invalid signed URL expiration');
    }
    if (Date.now() > expiresAt) {
      throw new GoneException('Signed URL has expired');
    }
    const expectedSignature: string = this.createSignature({
      fileName,
      expiresAt,
    });
    if (
      !this.isSignatureValid({
        expectedSignature,
        providedSignature: signature,
      })
    ) {
      throw new BadRequestException('Invalid signed URL signature');
    }
    return this.getStorageFilePath({ fileName });
  }

  /**
   * Delete one stored sprite and its local image file.
   * @param {{ userId: number; id: string }} params - Deletion params
   * @returns {Promise<{ deleted: boolean; id: string }>} - Deletion result
   */
  async remove(params: {
    userId: number;
    id: string;
  }): Promise<{ deleted: boolean; id: string }> {
    const { userId, id } = params;
    const records: PokemonSpriteRecord[] = await this.getUserSpriteRecords({
      userId,
    });
    const index: number = records.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new NotFoundException('Sprite not found');
    }
    const [record] = records.splice(index, 1);
    await this.saveUserSprites({ userId, records });
    const filePath: string = this.getStorageFilePath({
      fileName: record.fileName,
    });
    await this.deleteStorageFile({ filePath });
    return {
      deleted: true,
      id,
    };
  }

  /**
   * Delete all stored sprites and tracked storage files.
   * @param {{ userId: number }} params - Deletion params
   * @returns {Promise<{ deleted: boolean; count: number }>} - Deletion result
   */
  async removeAll(params: {
    userId: number;
  }): Promise<{ deleted: boolean; count: number }> {
    const { userId } = params;
    const records: PokemonSpriteRecord[] = await this.getUserSpriteRecords({
      userId,
    });
    await this.saveUserSprites({ userId, records: [] });
    await Promise.all(
      records.map(async (record) => {
        const filePath: string = this.getStorageFilePath({
          fileName: record.fileName,
        });
        await this.deleteStorageFile({ filePath });
      }),
    );
    return {
      deleted: true,
      count: records.length,
    };
  }

  /**
   * Build sprite response with a new signed URL.
   * @param {{ record: PokemonSpriteRecord }} params - Record params
   * @returns {PokemonSpriteResponse} - Signed response object
   */
  private toSpriteResponse(params: {
    record: PokemonSpriteRecord;
  }): PokemonSpriteResponse {
    const { record } = params;
    const signedUrlPayload: { signedUrl: string; expiresAt: number } =
      this.createSignedSpriteUrl({ fileName: record.fileName });
    return {
      id: record.id,
      pokemonId: record.pokemonId,
      name: record.name,
      signedUrl: signedUrlPayload.signedUrl,
      expiresAt: signedUrlPayload.expiresAt,
    };
  }

  /**
   * Create signed URL to access a stored sprite.
   * @param {{ fileName: string; ttlMs?: number }} params - Signed URL params
   * @returns {{ signedUrl: string; expiresAt: number }} - Signed URL payload
   */
  private createSignedSpriteUrl(params: { fileName: string; ttlMs?: number }): {
    signedUrl: string;
    expiresAt: number;
  } {
    const { fileName, ttlMs = SIGNED_URL_TTL_MS } = params;
    const expiresAt: number = Date.now() + ttlMs;
    const signature: string = this.createSignature({ fileName, expiresAt });
    return {
      signedUrl: `/pokemon/storage/${encodeURIComponent(fileName)}?expires=${expiresAt}&signature=${signature}`,
      expiresAt,
    };
  }

  /**
   * Create deterministic HMAC signature for signed URL.
   * @param {{ fileName: string; expiresAt: number }} params - Signature params
   * @returns {string} - URL signature
   */
  private createSignature(params: {
    fileName: string;
    expiresAt: number;
  }): string {
    const { fileName, expiresAt } = params;
    return createHmac('sha256', this.storageSecretKey)
      .update(`${fileName}:${expiresAt}`)
      .digest('hex');
  }

  /**
   * Compare signatures in constant time to avoid timing attacks.
   * @param {{ expectedSignature: string; providedSignature: string }} params - Signature pair
   * @returns {boolean} - True when signatures are equal
   */
  private isSignatureValid(params: {
    expectedSignature: string;
    providedSignature: string;
  }): boolean {
    const { expectedSignature, providedSignature } = params;
    const expectedBuffer: Buffer = Buffer.from(expectedSignature);
    const providedBuffer: Buffer = Buffer.from(providedSignature);
    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, providedBuffer);
  }

  /**
   * Build storage file absolute path.
   * @param {{ fileName: string }} params - Path params
   * @returns {string} - Absolute file path
   */
  private getStorageFilePath(params: { fileName: string }): string {
    const { fileName } = params;
    return path.join(this.storagePath, fileName);
  }

  /**
   * Delete one file from local storage if it exists.
   * @param {{ filePath: string }} params - Deletion params
   * @returns {Promise<void>} - Promise resolved after delete attempt
   */
  private async deleteStorageFile(params: { filePath: string }): Promise<void> {
    const { filePath } = params;
    try {
      await unlink(filePath);
    } catch (error) {
      this.logger.warn(`Skipping file deletion for ${filePath}`);
      this.logger.error('Storage delete error', error);
    }
  }

  /**
   * Generate unique id for in-memory sprite record.
   * @returns {string} - Record id
   */
  private generateSpriteRecordId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Build Redis key for one user's sprite collection.
   * @param {{ userId: number }} params - Key params
   * @returns {string} Redis key
   */
  private getUserSpritesRedisKey(params: { userId: number }): string {
    return `${USER_SPRITES_REDIS_KEY_PREFIX}:${params.userId}`;
  }

  /**
   * Read sprite records from Redis for one user.
   * @param {{ userId: number }} params - Read params
   * @returns {Promise<PokemonSpriteRecord[]>} Sprite records
   */
  private async getUserSpriteRecords(params: {
    userId: number;
  }): Promise<PokemonSpriteRecord[]> {
    const redisKey: string = this.getUserSpritesRedisKey({
      userId: params.userId,
    });
    const serializedRecords: string | null =
      await this.redisClient.get(redisKey);
    if (!serializedRecords) {
      return [];
    }
    try {
      const parsedRecords: unknown = JSON.parse(serializedRecords);
      if (!Array.isArray(parsedRecords)) {
        return [];
      }
      return parsedRecords as PokemonSpriteRecord[];
    } catch {
      this.logger.warn(`Invalid redis sprite payload for key ${redisKey}`);
      return [];
    }
  }

  /**
   * Persist sprite records in Redis for one user.
   * @param {{ userId: number; records: PokemonSpriteRecord[] }} params - Save params
   * @returns {Promise<void>} No return
   */
  private async saveUserSprites(params: {
    userId: number;
    records: PokemonSpriteRecord[];
  }): Promise<void> {
    const redisKey: string = this.getUserSpritesRedisKey({
      userId: params.userId,
    });
    await this.redisClient.set(redisKey, JSON.stringify(params.records));
  }

  /**
   * Close Redis client on module shutdown.
   * @returns {Promise<void>} No return
   */
  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }
}
