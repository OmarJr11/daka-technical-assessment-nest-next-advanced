"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth";
import { DashboardHeader } from "@/features/pokemon/dashboard/components/dashboard-header";
import { SpriteGrid } from "@/features/pokemon/dashboard/components/sprite-grid";
import { POKEMON_DASHBOARD_CONSTANT } from "@/features/pokemon/dashboard/constants/pokemon-dashboard.constant";
import { usePokemonSocket } from "@/features/pokemon/dashboard/hooks/use-pokemon-socket";
import { useSpriteCache } from "@/features/pokemon/dashboard/hooks/use-sprite-cache";

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
  const [failedSpriteImageIds, setFailedSpriteImageIds] = useState<string[]>([]);
  const [deletingSpriteIds, setDeletingSpriteIds] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [currentTimestampMs, setCurrentTimestampMs] = useState<number>(0);
  const {
    sprites,
    setSprites,
    hasSprites,
    isSyncingSprites,
    syncSpritesFromApi,
    getSpriteImageUrl,
  } = useSpriteCache({
    user,
    isInitialized,
    isLoading,
  });
  const {
    isSocketConnected,
    socketError,
    pendingRequestCount,
    requestSprite,
    deleteSprite,
    deleteAllSprites,
    clearSocketError,
    setSocketError,
  } = usePokemonSocket({
    user,
    isInitialized,
    isLoading,
    syncSpritesFromApi,
    setSprites,
    setFailedSpriteImageIds,
    setDeletingSpriteIds,
  });
  const canRequestSprite: boolean = Boolean(user) && isSocketConnected;
  const socketStatusLabel: string = useMemo((): string => {
    if (isSocketConnected) {
      return POKEMON_DASHBOARD_CONSTANT.socketConnectedLabel;
    }
    return POKEMON_DASHBOARD_CONSTANT.socketDisconnectedLabel;
  }, [isSocketConnected]);
  useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }
    if (!user) {
      router.replace("/login");
    }
  }, [isInitialized, isLoading, user, router]);

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
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Refreshes sprite list and renews signed URLs.
   * @returns {Promise<void>} No return
   */
  const handleRefreshSprites = async (): Promise<void> => {
    try {
      await syncSpritesFromApi({ force: true });
      setFailedSpriteImageIds([]);
      clearSocketError();
    } catch (error) {
      if (error instanceof Error) {
        setSocketError(error.message);
        return;
      }
      setSocketError("Could not refresh sprites.");
    }
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
        <p className="text-sm text-zinc-600">
          {POKEMON_DASHBOARD_CONSTANT.sessionLoadingLabel}
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="text-sm text-zinc-600">
          {POKEMON_DASHBOARD_CONSTANT.sessionRedirectingLabel}
        </p>
      </main>
    );
  }

  const refreshLabel: string = isSyncingSprites
    ? POKEMON_DASHBOARD_CONSTANT.refreshingSpritesLabel
    : POKEMON_DASHBOARD_CONSTANT.refreshSpritesLabel;

  return (
    <main className="min-h-screen bg-zinc-50 p-4 sm:p-6">
      <section className="mx-auto w-full max-w-6xl rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <DashboardHeader
          username={user.username}
          isSocketConnected={isSocketConnected}
          socketStatusLabel={socketStatusLabel}
          pendingRequestCount={pendingRequestCount}
          isLoggingOut={isLoggingOut}
          canRequestSprite={canRequestSprite}
          hasSprites={hasSprites}
          isSyncingSprites={isSyncingSprites}
          onLogout={handleLogout}
          onRequestSprite={requestSprite}
          onDeleteAllSprites={deleteAllSprites}
          onRefreshSprites={handleRefreshSprites}
          refreshLabel={refreshLabel}
        />
        {socketError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {socketError}
          </p>
        ) : null}
        <SpriteGrid
          sprites={sprites}
          hasSprites={hasSprites}
          currentTimestampMs={currentTimestampMs}
          failedSpriteImageIds={failedSpriteImageIds}
          deletingSpriteIds={deletingSpriteIds}
          canRequestSprite={canRequestSprite}
          isSyncingSprites={isSyncingSprites}
          animationDurationSeconds={
            POKEMON_DASHBOARD_CONSTANT.spriteAnimationDurationSeconds
          }
          getSpriteImageUrl={getSpriteImageUrl}
          onRefreshSprites={handleRefreshSprites}
          onDeleteSprite={deleteSprite}
          onSpriteImageError={handleSpriteImageError}
          signedUrlExpiredLabel={POKEMON_DASHBOARD_CONSTANT.signedUrlExpiredLabel}
          signedUrlActiveLabel={POKEMON_DASHBOARD_CONSTANT.signedUrlActiveLabel}
          refreshLabel={refreshLabel}
        />
      </section>
    </main>
  );
}
