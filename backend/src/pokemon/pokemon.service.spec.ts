import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PokemonService } from './pokemon.service';
import { POKEMON_QUEUE_NAME } from './constants/pokemon-queue-name.constant';

describe('PokemonService', () => {
  let service: PokemonService;

  beforeEach(async () => {
    process.env.STORAGE_SECRET_KEY = 'test-storage-secret';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonService,
        {
          provide: getQueueToken(POKEMON_QUEUE_NAME),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PokemonService>(PokemonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
