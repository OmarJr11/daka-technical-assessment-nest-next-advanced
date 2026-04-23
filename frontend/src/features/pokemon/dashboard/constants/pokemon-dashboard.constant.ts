export const POKEMON_DASHBOARD_CONSTANT = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  socketConnectedLabel: 'Connected',
  socketDisconnectedLabel: 'Disconnected',
  socketDisconnectedError: 'Socket is not connected.',
  sessionLoadingLabel: 'Loading session...',
  sessionRedirectingLabel: 'Redirecting to login...',
  refreshSpritesLabel: 'Refresh Sprites',
  refreshingSpritesLabel: 'Refreshing...',
  signedUrlExpiredLabel: 'Signed URL expired',
  signedUrlActiveLabel: 'Signed URL active',
  spriteImageLoadFailedLabel:
    'Could not load image. It may be expired or temporarily unavailable.',
  spriteSignedUrlExpiredLabel: 'Signed URL expired. Refresh to renew access.',
  localStorageWriteWarning: 'Ignoring local storage write error.',
  spriteSyncCooldownMs: 1500,
  spriteAnimationDurationSeconds: 0.25,
  spriteCacheKeyPrefix: 'pokemon-sprites-cache',
} as const;
