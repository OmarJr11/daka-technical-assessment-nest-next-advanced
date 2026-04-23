import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { PokemonSocketContract } from '@/lib/pokemon-socket-types';
import { POKEMON_DASHBOARD_CONSTANT } from '../constants/pokemon-dashboard.constant';

type PokemonSprite = PokemonSocketContract['sprite'];

type DashboardUser = {
  id: number;
  username: string;
};

type UseSpriteCacheParams = {
  user: DashboardUser | null;
  isInitialized: boolean;
  isLoading: boolean;
};

type UseSpriteCacheResult = {
  sprites: PokemonSprite[];
  setSprites: Dispatch<SetStateAction<PokemonSprite[]>>;
  hasSprites: boolean;
  isSyncingSprites: boolean;
  syncSpritesFromApi: (params?: { force?: boolean }) => Promise<void>;
  getSpriteImageUrl: (signedUrl: string) => string;
};

/**
 * Manages sprite state, local cache, and API synchronization.
 * @param {UseSpriteCacheParams} params - Hook inputs
 * @returns {UseSpriteCacheResult} Sprite state and actions
 */
function useSpriteCache(params: UseSpriteCacheParams): UseSpriteCacheResult {
  const { user, isInitialized, isLoading } = params;
  const [sprites, setSprites] = useState<PokemonSprite[]>([]);
  const [isSyncingSprites, setIsSyncingSprites] = useState<boolean>(false);
  const lastSpriteSyncAtRef = useRef<number>(0);
  const hasSprites: boolean = sprites.length > 0;
  const getSpriteImageUrl = useCallback((signedUrl: string): string => {
    if (signedUrl.startsWith('http://') || signedUrl.startsWith('https://')) {
      return signedUrl;
    }
    return `${POKEMON_DASHBOARD_CONSTANT.apiBaseUrl}${signedUrl}`;
  }, []);
  const getSpriteCacheKey = useCallback((): string | null => {
    if (!user) {
      return null;
    }
    return `${POKEMON_DASHBOARD_CONSTANT.spriteCacheKeyPrefix}:${user.id}`;
  }, [user]);
  const syncSpritesFromApi = useCallback(
    async (syncParams: { force?: boolean } = {}): Promise<void> => {
      const { force = false } = syncParams;
      if (!user) {
        return;
      }
      const currentTimestamp: number = Date.now();
      if (
        !force &&
        currentTimestamp - lastSpriteSyncAtRef.current <
          POKEMON_DASHBOARD_CONSTANT.spriteSyncCooldownMs
      ) {
        return;
      }
      lastSpriteSyncAtRef.current = currentTimestamp;
      setIsSyncingSprites(true);
      try {
        const response: Response = await fetch(
          `${POKEMON_DASHBOARD_CONSTANT.apiBaseUrl}/pokemon`,
          {
            method: 'GET',
            credentials: 'include',
          },
        );
        if (!response.ok) {
          throw new Error(`Could not refresh sprites (HTTP ${response.status}).`);
        }
        const fetchedSprites: PokemonSprite[] =
          (await response.json()) as PokemonSprite[];
        setSprites(fetchedSprites);
      } finally {
        setIsSyncingSprites(false);
      }
    },
    [user],
  );
  useEffect(() => {
    if (!isInitialized || isLoading || !user) {
      return;
    }
    const cacheKey: string | null = getSpriteCacheKey();
    if (!cacheKey) {
      return;
    }
    try {
      const cachedSpritesRaw: string | null = window.localStorage.getItem(cacheKey);
      if (!cachedSpritesRaw) {
        return;
      }
      const cachedSprites: PokemonSprite[] =
        JSON.parse(cachedSpritesRaw) as PokemonSprite[];
      const timeoutId: ReturnType<typeof setTimeout> = setTimeout((): void => {
        setSprites(cachedSprites);
      }, 0);
      return (): void => {
        clearTimeout(timeoutId);
      };
    } catch {
      window.localStorage.removeItem(cacheKey);
    }
  }, [isInitialized, isLoading, user, getSpriteCacheKey]);
  useEffect(() => {
    const cacheKey: string | null = getSpriteCacheKey();
    if (!cacheKey) {
      return;
    }
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(sprites));
    } catch {
      console.warn(POKEMON_DASHBOARD_CONSTANT.localStorageWriteWarning);
    }
  }, [sprites, getSpriteCacheKey]);
  useEffect(() => {
    if (!isInitialized || isLoading || !user) {
      return;
    }
    void syncSpritesFromApi();
  }, [isInitialized, isLoading, user, syncSpritesFromApi]);
  return useMemo(
    () => ({
      sprites,
      setSprites,
      hasSprites,
      isSyncingSprites,
      syncSpritesFromApi,
      getSpriteImageUrl,
    }),
    [
      sprites,
      hasSprites,
      isSyncingSprites,
      syncSpritesFromApi,
      getSpriteImageUrl,
    ],
  );
}

export { useSpriteCache };
