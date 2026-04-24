import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpriteCache } from './use-sprite-cache';

type MockSprite = {
  id: string;
  pokemonId: number;
  name: string;
  signedUrl: string;
  expiresAt: number;
};

describe('useSpriteCache', () => {
  beforeEach((): void => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('should resolve absolute and relative image urls', (): void => {
    const { result } = renderHook(() =>
      useSpriteCache({
        user: null,
        isInitialized: false,
        isLoading: false,
      }),
    );
    expect(result.current.getSpriteImageUrl('https://cdn.example.com/pika.png')).toBe(
      'https://cdn.example.com/pika.png',
    );
    expect(result.current.getSpriteImageUrl('/pokemon/storage/pika.png')).toBe(
      'http://localhost:3000/pokemon/storage/pika.png',
    );
  });

  it('should sync sprites from api and expose cached state', async (): Promise<void> => {
    const mockedSprites: MockSprite[] = [
      {
        id: 'sprite-1',
        pokemonId: 25,
        name: 'pikachu',
        signedUrl: '/pokemon/storage/pika.png',
        expiresAt: Date.now() + 1000,
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async (): Promise<MockSprite[]> => mockedSprites,
      } as Response),
    );
    const { result } = renderHook(() =>
      useSpriteCache({
        user: { id: 5, username: 'ash' },
        isInitialized: true,
        isLoading: false,
      }),
    );
    await waitFor((): void => {
      expect(result.current.sprites).toEqual(mockedSprites);
    });
    await waitFor((): void => {
      expect(result.current.hasSprites).toBe(true);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
