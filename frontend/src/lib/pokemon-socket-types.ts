type PokemonSprite = {
  id: string;
  pokemonId: number;
  name: string;
  signedUrl: string;
  expiresAt: number;
};

type RequestSpriteEventPayload = {
  jobId: string;
};

type DeleteSpriteEventPayload = {
  id: string;
};

type SpriteDeletedEventPayload = {
  deleted: boolean;
  id: string;
};

type SpritesClearedEventPayload = {
  deleted: boolean;
  count: number;
};

type SpriteErrorEventPayload = {
  jobId?: string;
  message: string;
};

type ClientToServerEvents = {
  "request-sprite": () => void;
  "delete-sprite": (payload: DeleteSpriteEventPayload) => void;
  "delete-all-sprites": () => void;
};

type ServerToClientEvents = {
  "sprite-requested": (payload: RequestSpriteEventPayload) => void;
  "sprite-served": (payload: PokemonSprite) => void;
  "sprite-deleted": (payload: SpriteDeletedEventPayload) => void;
  "sprites-cleared": (payload: SpritesClearedEventPayload) => void;
  "sprite-error": (payload: SpriteErrorEventPayload) => void;
};

type PokemonSocketContract = {
  sprite: PokemonSprite;
  requestSpritePayload: RequestSpriteEventPayload;
  deleteSpritePayload: DeleteSpriteEventPayload;
  spriteDeletedPayload: SpriteDeletedEventPayload;
  spritesClearedPayload: SpritesClearedEventPayload;
  spriteErrorPayload: SpriteErrorEventPayload;
  clientToServerEvents: ClientToServerEvents;
  serverToClientEvents: ServerToClientEvents;
};

export type { PokemonSocketContract };
