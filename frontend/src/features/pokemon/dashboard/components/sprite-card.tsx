import Image from 'next/image';
import type { ReactElement } from 'react';
import type { PokemonSocketContract } from '@/lib/pokemon-socket-types';

type PokemonSprite = PokemonSocketContract['sprite'];

type SpriteCardProps = {
  sprite: PokemonSprite;
  spriteImageUrl: string;
  hasExpiredUrl: boolean;
  hasImageError: boolean;
  isDeletingSprite: boolean;
  canRequestSprite: boolean;
  isSyncingSprites: boolean;
  signedUrlExpiredLabel: string;
  signedUrlActiveLabel: string;
  onRefreshSprites: () => Promise<void>;
  onDeleteSprite: (id: string) => void;
  onSpriteImageError: (spriteId: string) => void;
  refreshLabel: string;
  animationDurationSeconds: number;
};

/**
 * Renders one pokemon sprite card with status and actions.
 * @param {SpriteCardProps} props - Component props
 * @returns {ReactElement} Sprite card
 */
function SpriteCard(props: SpriteCardProps): ReactElement {
  const {
    sprite,
    spriteImageUrl,
    hasExpiredUrl,
    hasImageError,
    isDeletingSprite,
    canRequestSprite,
    isSyncingSprites,
    signedUrlExpiredLabel,
    signedUrlActiveLabel,
    onRefreshSprites,
    onDeleteSprite,
    onSpriteImageError,
    refreshLabel,
    animationDurationSeconds,
  } = props;
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md">
      {hasExpiredUrl ? (
        <div className="flex h-36 w-full items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-rose-700">
              Signed URL expired. Refresh to renew access.
            </p>
            <button
              type="button"
              className="cursor-pointer rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={(): void => {
                void onRefreshSprites();
              }}
              disabled={isSyncingSprites}
            >
              {refreshLabel}
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
            onSpriteImageError(sprite.id);
          }}
        />
      )}
      <h3 className="mt-3 text-base font-semibold capitalize text-zinc-900">
        {sprite.name}
      </h3>
      <p className="mt-1 text-xs text-zinc-600">Pokemon ID: {sprite.pokemonId}</p>
      <p
        className={
          hasExpiredUrl ? 'mt-1 text-xs font-medium text-rose-600' : 'mt-1 text-xs text-zinc-500'
        }
      >
        {hasExpiredUrl ? signedUrlExpiredLabel : signedUrlActiveLabel}
      </p>
      <button
        type="button"
        className="mt-3 cursor-pointer rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        onClick={(): void => {
          onDeleteSprite(sprite.id);
        }}
        disabled={!canRequestSprite || isDeletingSprite}
      >
        {isDeletingSprite ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"
              style={{ animationDuration: `${animationDurationSeconds}s` }}
            />
            Deleting...
          </span>
        ) : (
          'Delete'
        )}
      </button>
    </article>
  );
}

export { SpriteCard };
