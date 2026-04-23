import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import pokemonSocketClient from '@/lib/pokemon-socket';
import type { PokemonSocketContract } from '@/lib/pokemon-socket-types';
import { POKEMON_DASHBOARD_CONSTANT } from '../constants/pokemon-dashboard.constant';

type PokemonSprite = PokemonSocketContract['sprite'];
type RequestSpritePayload = PokemonSocketContract['requestSpritePayload'];
type SpriteDeletedPayload = PokemonSocketContract['spriteDeletedPayload'];
type SpritesClearedPayload = PokemonSocketContract['spritesClearedPayload'];
type SpriteErrorPayload = PokemonSocketContract['spriteErrorPayload'];

type DashboardUser = {
  id: number;
  username: string;
};

type UsePokemonSocketParams = {
  user: DashboardUser | null;
  isInitialized: boolean;
  isLoading: boolean;
  syncSpritesFromApi: () => Promise<void>;
  setSprites: Dispatch<SetStateAction<PokemonSprite[]>>;
  setFailedSpriteImageIds: Dispatch<SetStateAction<string[]>>;
  setDeletingSpriteIds: Dispatch<SetStateAction<string[]>>;
};

type UsePokemonSocketResult = {
  isSocketConnected: boolean;
  socketError: string;
  pendingRequestCount: number;
  requestSprite: () => void;
  deleteSprite: (id: string) => void;
  deleteAllSprites: () => void;
  clearSocketError: () => void;
  setSocketError: Dispatch<SetStateAction<string>>;
};

/**
 * Manages socket connection lifecycle and realtime sprite events.
 * @param {UsePokemonSocketParams} params - Hook inputs
 * @returns {UsePokemonSocketResult} Socket state and actions
 */
function usePokemonSocket(params: UsePokemonSocketParams): UsePokemonSocketResult {
  const {
    user,
    isInitialized,
    isLoading,
    syncSpritesFromApi,
    setSprites,
    setFailedSpriteImageIds,
    setDeletingSpriteIds,
  } = params;
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [socketError, setSocketError] = useState<string>('');
  const [pendingJobIds, setPendingJobIds] = useState<string[]>([]);
  const pendingRequestCount: number = pendingJobIds.length;
  const clearSocketError = useCallback((): void => {
    setSocketError('');
  }, []);
  useEffect(() => {
    if (!isInitialized || isLoading || !user) {
      return;
    }
    const socket = pokemonSocketClient.connect({
      onConnectionStateChange: (isConnected: boolean): void => {
        setIsSocketConnected(isConnected);
        if (!isConnected) {
          setDeletingSpriteIds([]);
          return;
        }
        clearSocketError();
        void syncSpritesFromApi().catch((): void => {
          setSocketError('Could not refresh sprites.');
        });
      },
      onConnectionError: (message: string): void => {
        setSocketError(message);
      },
    });
    const handleRequestAccepted = (payload: RequestSpritePayload): void => {
      setPendingJobIds((previousIds: string[]) => [...previousIds, payload.jobId]);
    };
    const handleSpriteServed = (payload: PokemonSprite): void => {
      setSprites((previousSprites: PokemonSprite[]) => [
        payload,
        ...previousSprites.filter((sprite: PokemonSprite) => sprite.id !== payload.id),
      ]);
      setFailedSpriteImageIds((previousIds: string[]) =>
        previousIds.filter((spriteId: string) => spriteId !== payload.id),
      );
      setPendingJobIds((previousIds: string[]) => previousIds.slice(1));
    };
    const handleSpriteDeleted = (payload: SpriteDeletedPayload): void => {
      if (!payload.deleted) {
        return;
      }
      setSprites((previousSprites: PokemonSprite[]) =>
        previousSprites.filter((sprite: PokemonSprite) => sprite.id !== payload.id),
      );
      setDeletingSpriteIds((previousIds: string[]) =>
        previousIds.filter((spriteId: string) => spriteId !== payload.id),
      );
      setFailedSpriteImageIds((previousIds: string[]) =>
        previousIds.filter((spriteId: string) => spriteId !== payload.id),
      );
    };
    const handleSpritesCleared = (payload: SpritesClearedPayload): void => {
      if (!payload.deleted) {
        return;
      }
      setSprites([]);
      setDeletingSpriteIds([]);
      setFailedSpriteImageIds([]);
    };
    const handleSpriteError = (payload: SpriteErrorPayload): void => {
      setSocketError(payload.message);
      if (!payload.jobId) {
        return;
      }
      setPendingJobIds((previousIds: string[]) =>
        previousIds.filter((jobId: string) => jobId !== payload.jobId),
      );
    };
    socket.on('sprite-requested', handleRequestAccepted);
    socket.on('sprite-served', handleSpriteServed);
    socket.on('sprite-deleted', handleSpriteDeleted);
    socket.on('sprites-cleared', handleSpritesCleared);
    socket.on('sprite-error', handleSpriteError);
    return (): void => {
      socket.off('sprite-requested', handleRequestAccepted);
      socket.off('sprite-served', handleSpriteServed);
      socket.off('sprite-deleted', handleSpriteDeleted);
      socket.off('sprites-cleared', handleSpritesCleared);
      socket.off('sprite-error', handleSpriteError);
      pokemonSocketClient.disconnect();
    };
  }, [
    isInitialized,
    isLoading,
    user,
    clearSocketError,
    syncSpritesFromApi,
    setSprites,
    setFailedSpriteImageIds,
    setDeletingSpriteIds,
  ]);
  const requestSprite = useCallback((): void => {
    const socket = pokemonSocketClient.getSocket();
    if (!socket || !isSocketConnected) {
      setSocketError(POKEMON_DASHBOARD_CONSTANT.socketDisconnectedError);
      return;
    }
    clearSocketError();
    socket.emit('request-sprite');
  }, [isSocketConnected, clearSocketError]);
  const deleteSprite = useCallback(
    (id: string): void => {
      const socket = pokemonSocketClient.getSocket();
      if (!socket || !isSocketConnected) {
        setSocketError(POKEMON_DASHBOARD_CONSTANT.socketDisconnectedError);
        return;
      }
      setDeletingSpriteIds((previousIds: string[]) => {
        if (previousIds.includes(id)) {
          return previousIds;
        }
        return [...previousIds, id];
      });
      clearSocketError();
      socket.emit('delete-sprite', { id });
    },
    [isSocketConnected, setDeletingSpriteIds, clearSocketError],
  );
  const deleteAllSprites = useCallback((): void => {
    const socket = pokemonSocketClient.getSocket();
    if (!socket || !isSocketConnected) {
      setSocketError(POKEMON_DASHBOARD_CONSTANT.socketDisconnectedError);
      return;
    }
    clearSocketError();
    socket.emit('delete-all-sprites');
  }, [isSocketConnected, clearSocketError]);
  return useMemo(
    () => ({
      isSocketConnected,
      socketError,
      pendingRequestCount,
      requestSprite,
      deleteSprite,
      deleteAllSprites,
      clearSocketError,
      setSocketError,
    }),
    [
      isSocketConnected,
      socketError,
      pendingRequestCount,
      requestSprite,
      deleteSprite,
      deleteAllSprites,
      clearSocketError,
    ],
  );
}

export { usePokemonSocket };
