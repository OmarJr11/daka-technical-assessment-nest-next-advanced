import { AnimatePresence, motion } from 'framer-motion';
import type { ReactElement } from 'react';
import type { PokemonSocketContract } from '@/lib/pokemon-socket-types';
import { SpriteCard } from './sprite-card';

type PokemonSprite = PokemonSocketContract['sprite'];

type SpriteGridProps = {
  sprites: PokemonSprite[];
  hasSprites: boolean;
  currentTimestampMs: number;
  failedSpriteImageIds: string[];
  deletingSpriteIds: string[];
  canRequestSprite: boolean;
  isSyncingSprites: boolean;
  animationDurationSeconds: number;
  getSpriteImageUrl: (signedUrl: string) => string;
  onRefreshSprites: () => Promise<void>;
  onDeleteSprite: (id: string) => void;
  onSpriteImageError: (spriteId: string) => void;
  signedUrlExpiredLabel: string;
  signedUrlActiveLabel: string;
  refreshLabel: string;
};

/**
 * Renders responsive sprite list with animated enter/exit transitions.
 * @param {SpriteGridProps} props - Component props
 * @returns {ReactElement} Sprite grid section
 */
function SpriteGrid(props: SpriteGridProps): ReactElement {
  const {
    sprites,
    hasSprites,
    currentTimestampMs,
    failedSpriteImageIds,
    deletingSpriteIds,
    canRequestSprite,
    isSyncingSprites,
    animationDurationSeconds,
    getSpriteImageUrl,
    onRefreshSprites,
    onDeleteSprite,
    onSpriteImageError,
    signedUrlExpiredLabel,
    signedUrlActiveLabel,
    refreshLabel,
  } = props;
  return (
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
                transition={{ duration: animationDurationSeconds, ease: 'easeOut' }}
              >
                <SpriteCard
                  sprite={sprite}
                  spriteImageUrl={spriteImageUrl}
                  hasExpiredUrl={hasExpiredUrl}
                  hasImageError={hasImageError}
                  isDeletingSprite={isDeletingSprite}
                  canRequestSprite={canRequestSprite}
                  isSyncingSprites={isSyncingSprites}
                  signedUrlExpiredLabel={signedUrlExpiredLabel}
                  signedUrlActiveLabel={signedUrlActiveLabel}
                  onRefreshSprites={onRefreshSprites}
                  onDeleteSprite={onDeleteSprite}
                  onSpriteImageError={onSpriteImageError}
                  refreshLabel={refreshLabel}
                  animationDurationSeconds={animationDurationSeconds}
                />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export { SpriteGrid };
