import type { ReactElement } from 'react';

type DashboardHeaderProps = {
  username: string;
  isSocketConnected: boolean;
  socketStatusLabel: string;
  pendingRequestCount: number;
  isLoggingOut: boolean;
  canRequestSprite: boolean;
  hasSprites: boolean;
  isSyncingSprites: boolean;
  onLogout: () => Promise<void>;
  onRequestSprite: () => void;
  onDeleteAllSprites: () => void;
  onRefreshSprites: () => Promise<void>;
  refreshLabel: string;
};

/**
 * Renders dashboard title, realtime status, and top actions.
 * @param {DashboardHeaderProps} props - Component props
 * @returns {ReactElement} Header section
 */
function DashboardHeader(props: DashboardHeaderProps): ReactElement {
  const {
    username,
    isSocketConnected,
    socketStatusLabel,
    pendingRequestCount,
    isLoggingOut,
    canRequestSprite,
    hasSprites,
    isSyncingSprites,
    onLogout,
    onRequestSprite,
    onDeleteAllSprites,
    onRefreshSprites,
    refreshLabel,
  } = props;
  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
            Welcome, {username}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Request and manage pokemon sprites in realtime.
          </p>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          onClick={(): void => {
            void onLogout();
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Logging out...
            </span>
          ) : (
            'Logout'
          )}
        </button>
      </header>
      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-700">
          Socket status:{' '}
          <span
            className={
              isSocketConnected
                ? 'font-semibold text-emerald-600'
                : 'font-semibold text-rose-600'
            }
          >
            {socketStatusLabel}
          </span>
          {pendingRequestCount > 0 ? ` · Pending jobs: ${pendingRequestCount}` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
            onClick={onRequestSprite}
            disabled={!canRequestSprite || isSyncingSprites}
          >
            Request Sprite
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
            onClick={onDeleteAllSprites}
            disabled={!canRequestSprite || !hasSprites || isSyncingSprites}
          >
            Delete All
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
            onClick={(): void => {
              void onRefreshSprites();
            }}
            disabled={isSyncingSprites}
          >
            {refreshLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export { DashboardHeader };
