"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import pokemonSocketClient from "@/lib/pokemon-socket";
import type { PokemonSocketContract } from "@/lib/pokemon-socket-types";
import useAuthStore from "@/store/auth";

type PokemonSprite = PokemonSocketContract["sprite"];
type RequestSpritePayload = PokemonSocketContract["requestSpritePayload"];
type SpriteDeletedPayload = PokemonSocketContract["spriteDeletedPayload"];
type SpritesClearedPayload = PokemonSocketContract["spritesClearedPayload"];
type SpriteErrorPayload = PokemonSocketContract["spriteErrorPayload"];

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const SPRITE_ANIMATION_DURATION_SECONDS = 0.25;
const SPRITE_SYNC_COOLDOWN_MS = 1500;
const SPRITE_CACHE_KEY_PREFIX = "pokemon-sprites-cache";

/**
 * Renders the authenticated dashboard with realtime pokemon sprites.
 * @returns {ReactElement} Dashboard page
 */
export default function DashboardPage(): ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [socketError, setSocketError] = useState<string>("");
  const [pendingJobIds, setPendingJobIds] = useState<string[]>([]);
  const [sprites, setSprites] = useState<PokemonSprite[]>([]);
  const [failedSpriteImageIds, setFailedSpriteImageIds] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isSyncingSprites, setIsSyncingSprites] = useState<boolean>(false);
  const [deletingSpriteIds, setDeletingSpriteIds] = useState<string[]>([]);
  const [currentTimestampMs, setCurrentTimestampMs] = useState<number>(0);
  const lastSpriteSyncAtRef = useRef<number>(0);

  const pendingRequestCount: number = pendingJobIds.length;
  const hasSprites: boolean = sprites.length > 0;
  const canRequestSprite: boolean = Boolean(user) && isSocketConnected;

  const socketStatusLabel: string = useMemo((): string => {
    if (isSocketConnected) {
      return "Connected";
    }
    return "Disconnected";
  }, [isSocketConnected]);

  /**
   * Builds full image URL from a signed sprite URL path.
   * @param {string} signedUrl - Signed path or absolute URL
   * @returns {string} Resolved image URL
   */
  const getSpriteImageUrl = (signedUrl: string): string => {
    if (signedUrl.startsWith("http://") || signedUrl.startsWith("https://")) {
      return signedUrl;
    }
    return `${API_BASE_URL}${signedUrl}`;
  };

  /**
   * Builds localStorage cache key per authenticated user.
   * @returns {string | null} Cache key or null when unavailable
   */
  const getSpriteCacheKey = useCallback((): string | null => {
    if (!user) {
      return null;
    }
    return `${SPRITE_CACHE_KEY_PREFIX}:${user.id}`;
  }, [user]);

  /**
   * Loads current stored sprites and refreshes signed URLs.
   * @param {{ force?: boolean }} params - Sync params
   * @returns {Promise<void>} No return
   */
  const syncSpritesFromApi = useCallback(async (params: { force?: boolean } = {}): Promise<void> => {
    const { force = false } = params;
    if (!user) {
      return;
    }
    const currentTimestamp: number = Date.now();
    if (
      !force &&
      currentTimestamp - lastSpriteSyncAtRef.current < SPRITE_SYNC_COOLDOWN_MS
    ) {
      return;
    }
    lastSpriteSyncAtRef.current = currentTimestamp;
    setIsSyncingSprites(true);
    try {
      const response: Response = await fetch(`${API_BASE_URL}/pokemon`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment.");
        }
        throw new Error(`Could not refresh sprites (HTTP ${response.status}).`);
      }
      const fetchedSprites: PokemonSprite[] = (await response.json()) as PokemonSprite[];
      setSprites(fetchedSprites);
      setFailedSpriteImageIds([]);
      setSocketError("");
    } catch (error) {
      if (error instanceof Error) {
        setSocketError(error.message);
      } else {
        setSocketError("Could not refresh sprites.");
      }
    } finally {
      setIsSyncingSprites(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }
    if (!user) {
      router.replace("/login");
    }
  }, [isInitialized, isLoading, user, router]);

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
      const cachedSprites: PokemonSprite[] = JSON.parse(cachedSpritesRaw) as PokemonSprite[];
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
      // Ignore localStorage write errors (quota/private mode)
    }
  }, [sprites, getSpriteCacheKey]);

  useEffect(() => {
    if (!isInitialized || isLoading || !user) {
      return;
    }
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout((): void => {
      void syncSpritesFromApi();
    }, 0);
    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [isInitialized, isLoading, user, syncSpritesFromApi]);

  useEffect(() => {
    if (!isInitialized || isLoading || !user) {
      return;
    }
    const socket = pokemonSocketClient.connect({
      onConnectionStateChange: (isConnected: boolean): void => {
        setIsSocketConnected(isConnected);
        if (isConnected) {
          setSocketError("");
          void syncSpritesFromApi();
          return;
        }
        setDeletingSpriteIds([]);
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
      setPendingJobIds((previousIds: string[]) => {
        if (previousIds.length === 0) {
          return previousIds;
        }
        return previousIds.slice(1);
      });
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
    socket.on("sprite-requested", handleRequestAccepted);
    socket.on("sprite-served", handleSpriteServed);
    socket.on("sprite-deleted", handleSpriteDeleted);
    socket.on("sprites-cleared", handleSpritesCleared);
    socket.on("sprite-error", handleSpriteError);
    return () => {
      socket.off("sprite-requested", handleRequestAccepted);
      socket.off("sprite-served", handleSpriteServed);
      socket.off("sprite-deleted", handleSpriteDeleted);
      socket.off("sprites-cleared", handleSpritesCleared);
      socket.off("sprite-error", handleSpriteError);
      pokemonSocketClient.disconnect();
    };
  }, [isInitialized, isLoading, user, syncSpritesFromApi]);

  useEffect(() => {
    const intervalId: ReturnType<typeof setInterval> = setInterval((): void => {
      setCurrentTimestampMs(Date.now());
    }, 1000);
    return (): void => {
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    pokemonSocketClient.disconnect();
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Requests one random sprite from backend queue.
   * @returns {void} No return
   */
  const handleRequestSprite = (): void => {
    const socket = pokemonSocketClient.getSocket();
    if (!socket || !isSocketConnected) {
      setSocketError("Socket is not connected.");
      return;
    }
    setSocketError("");
    socket.emit("request-sprite");
  };

  /**
   * Deletes one sprite by id.
   * @param {string} id - Sprite id
   * @returns {void} No return
   */
  const handleDeleteSprite = (id: string): void => {
    const socket = pokemonSocketClient.getSocket();
    if (!socket || !isSocketConnected) {
      setSocketError("Socket is not connected.");
      return;
    }
    setDeletingSpriteIds((previousIds: string[]) => {
      if (previousIds.includes(id)) {
        return previousIds;
      }
      return [...previousIds, id];
    });
    setSocketError("");
    socket.emit("delete-sprite", { id });
  };

  /**
   * Deletes all listed sprites.
   * @returns {void} No return
   */
  const handleDeleteAllSprites = (): void => {
    const socket = pokemonSocketClient.getSocket();
    if (!socket || !isSocketConnected) {
      setSocketError("Socket is not connected.");
      return;
    }
    setSocketError("");
    socket.emit("delete-all-sprites");
  };

  /**
   * Refreshes sprite list and renews signed URLs.
   * @returns {Promise<void>} No return
   */
  const handleRefreshSprites = async (): Promise<void> => {
    await syncSpritesFromApi({ force: true });
  };

  /**
   * Marks one sprite image as failed and displays fallback UI.
   * @param {string} spriteId - Sprite id
   * @returns {void} No return
   */
  const handleSpriteImageError = (spriteId: string): void => {
    setFailedSpriteImageIds((previousIds: string[]) => {
      if (previousIds.includes(spriteId)) {
        return previousIds;
      }
      return [...previousIds, spriteId];
    });
  };

  if (!isInitialized || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="text-sm text-zinc-600">Loading session...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="text-sm text-zinc-600">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-4 sm:p-6">
      <section className="mx-auto w-full max-w-6xl rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Welcome, {user.username}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Request and manage pokemon sprites in realtime.
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Logging out...
              </span>
            ) : (
              "Logout"
            )}
          </button>
        </header>
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-700">
            Socket status:{" "}
            <span
              className={
                isSocketConnected
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-rose-600"
              }
            >
              {socketStatusLabel}
            </span>
            {pendingRequestCount > 0 ? ` · Pending jobs: ${pendingRequestCount}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={handleRequestSprite}
              disabled={!canRequestSprite || isSyncingSprites}
            >
              Request Sprite
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={handleDeleteAllSprites}
              disabled={!canRequestSprite || !hasSprites || isSyncingSprites}
            >
              Delete All
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={handleRefreshSprites}
              disabled={isSyncingSprites || !user}
            >
              {isSyncingSprites ? "Refreshing..." : "Refresh Sprites"}
            </button>
          </div>
        </div>
        {socketError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {socketError}
          </p>
        ) : null}
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-zinc-900">Sprites</h2>
          {!hasSprites ? (
            <p className="mt-2 text-sm text-zinc-600">
              No sprites yet. Request one to start.
            </p>
          ) : null}
          <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {sprites.map((sprite: PokemonSprite) => {
                const spriteImageUrl: string = getSpriteImageUrl(sprite.signedUrl);
                const hasExpiredUrl: boolean = currentTimestampMs > sprite.expiresAt;
                const hasImageError: boolean = failedSpriteImageIds.includes(sprite.id);
                const isDeletingSprite: boolean = deletingSpriteIds.includes(sprite.id);
                return (
                  <motion.li
                    key={sprite.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: SPRITE_ANIMATION_DURATION_SECONDS, ease: "easeOut" }}
                    className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md"
                  >
                    {hasExpiredUrl ? (
                      <div className="flex h-36 w-full items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-xs font-medium text-rose-700">
                            Signed URL expired. Refresh to renew access.
                          </p>
                          <button
                            type="button"
                            className="cursor-pointer rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
                            onClick={handleRefreshSprites}
                            disabled={isSyncingSprites}
                          >
                            {isSyncingSprites ? "Refreshing..." : "Refresh"}
                          </button>
                        </div>
                      </div>
                    ) : hasImageError ? (
                      <div className="flex h-36 w-full items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-3 text-center">
                        <p className="text-xs font-medium text-amber-700">
                          Could not load image. It may be expired or temporarily unavailable.
                        </p>
                      </div>
                    ) : (
                      <Image
                        src={spriteImageUrl}
                        alt={sprite.name}
                        width={320}
                        height={144}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="h-36 w-full rounded-md bg-zinc-100 object-contain"
                        unoptimized
                        onError={(): void => {
                          handleSpriteImageError(sprite.id);
                        }}
                      />
                    )}
                    <h3 className="mt-3 text-base font-semibold capitalize text-zinc-900">
                      {sprite.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600">Pokemon ID: {sprite.pokemonId}</p>
                    <p
                      className={
                        hasExpiredUrl
                          ? "mt-1 text-xs font-medium text-rose-600"
                          : "mt-1 text-xs text-zinc-500"
                      }
                    >
                      {hasExpiredUrl ? "Signed URL expired" : "Signed URL active"}
                    </p>
                    <button
                      type="button"
                      className="mt-3 cursor-pointer rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      onClick={(): void => handleDeleteSprite(sprite.id)}
                      disabled={!canRequestSprite || isDeletingSprite}
                    >
                      {isDeletingSprite ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Deleting...
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      </section>
    </main>
  );
}
