import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PokemonService } from './pokemon.service';
import { POKEMON_QUEUE_NAME } from './constants/pokemon-queue-name.constant';

const redisSetMock = jest.fn();
const redisQuitMock = jest.fn();
const redisGetMock = jest.fn();

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    set: redisSetMock,
    quit: redisQuitMock,
    get: redisGetMock,
  })),
);

describe('PokemonService', () => {
  let service: PokemonService;
  const queueMock = {
    add: jest.fn(),
  };

  beforeEach(async (): Promise<void> => {
    process.env.STORAGE_SECRET_KEY = 'test-storage-secret';
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonService,
        {
          provide: getQueueToken(POKEMON_QUEUE_NAME),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<PokemonService>(PokemonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enqueue pokemon sprite request', async (): Promise<void> => {
    queueMock.add.mockResolvedValue({
      id: 'job-1',
    });
    const result = await service.enqueueRandomSpriteRequest({
      userId: 9,
      requestedBy: 'unit-test',
    });
    expect(result).toEqual({
      jobId: 'job-1',
    });
    expect(queueMock.add).toHaveBeenCalled();
  });

  it('should persist user sprites with 30-minute redis ttl', async (): Promise<void> => {
    redisGetMock.mockResolvedValue('[]');
    await service.registerProcessedSprite({
      result: {
        userId: 2,
        pokemonId: 25,
        name: 'pikachu',
        fileName: 'sprite.png',
      },
    });
    expect(redisSetMock).toHaveBeenCalledWith(
      'pokemon:sprites:user:2',
      expect.any(String),
      'EX',
      1800,
    );
  });
});
