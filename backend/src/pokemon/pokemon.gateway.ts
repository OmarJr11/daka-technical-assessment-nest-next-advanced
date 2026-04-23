import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { PokemonService } from './pokemon.service';
import { PokemonSpriteResponse } from './interfaces/pokemon-sprite-response.interface';

type JwtPayload = {
  sub: number;
  username: string;
};

type SpriteDeletePayload = {
  id: string;
};

type PokemonSocketData = {
  userId?: number;
  username?: string;
};

type ClientToServerEvents = {
  'request-sprite': () => void;
  'delete-sprite': (payload: SpriteDeletePayload) => void;
  'delete-all-sprites': () => void;
};

type ServerToClientEvents = {
  'sprite-requested': (payload: { jobId: string }) => void;
  'sprite-served': (payload: PokemonSpriteResponse) => void;
  'sprite-deleted': (payload: { deleted: boolean; id: string }) => void;
  'sprites-cleared': (payload: { deleted: boolean; count: number }) => void;
  'sprite-error': (payload: { jobId?: string; message: string }) => void;
};

type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  PokemonSocketData
>;

/**
 * Handles pokemon websocket events with JWT authentication.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class PokemonGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger: Logger = new Logger(PokemonGateway.name);

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Validate JWT during websocket connection.
   * @param {Socket} client - Socket client
   * @returns {Promise<void>} - Promise resolved when auth succeeds
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token: string = this.extractAccessToken({ client });
      const payload: JwtPayload =
        await this.jwtService.verifyAsync<JwtPayload>(token);
      await this.authService.getUserById(payload.sub);
      client.data.userId = payload.sub;
      client.data.username = payload.username;
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      this.logger.warn(`Rejected websocket client: ${client.id}`);
      client.emit('sprite-error', {
        message: 'Unauthorized socket connection',
      });
      client.disconnect(true);
    }
  }

  /**
   * Log websocket disconnect events.
   * @param {Socket} client - Socket client
   * @returns {void} - No return
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Enqueue random sprite generation request.
   * @param {Socket} client - Socket client
   * @returns {Promise<void>} - Promise resolved after enqueue
   */
  @SubscribeMessage('request-sprite')
  async requestSprite(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const requestedBy: string = String(client.data.username ?? client.id);
    const enqueueResult = await this.pokemonService.enqueueRandomSpriteRequest({
      requestedBy,
    });
    client.emit('sprite-requested', enqueueResult);
  }

  /**
   * Delete one sprite by id and broadcast result.
   * @param {Socket} client - Socket client
   * @param {SpriteDeletePayload} payload - Delete payload
   * @returns {Promise<void>} - Promise resolved after delete
   */
  @SubscribeMessage('delete-sprite')
  async deleteSprite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SpriteDeletePayload,
  ): Promise<void> {
    try {
      const result = await this.pokemonService.remove(payload.id);
      this.server.emit('sprite-deleted', result);
    } catch {
      client.emit('sprite-error', { message: 'Could not delete sprite' });
    }
  }

  /**
   * Delete all sprites and broadcast result.
   * @param {Socket} client - Socket client
   * @returns {Promise<void>} - Promise resolved after delete
   */
  @SubscribeMessage('delete-all-sprites')
  async deleteAllSprites(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const result = await this.pokemonService.removeAll();
      this.server.emit('sprites-cleared', result);
    } catch {
      client.emit('sprite-error', { message: 'Could not clear sprites' });
    }
  }

  /**
   * Emit processed sprite to connected clients.
   * @param {PokemonSpriteResponse} payload - Sprite payload
   * @returns {void} - No return
   */
  emitSpriteServed(payload: PokemonSpriteResponse): void {
    this.server.emit('sprite-served', payload);
  }

  /**
   * Emit processing errors to connected clients.
   * @param {{ jobId?: string; message: string }} payload - Error payload
   * @returns {void} - No return
   */
  emitSpriteError(payload: { jobId?: string; message: string }): void {
    this.server.emit('sprite-error', payload);
  }

  /**
   * Extract bearer token from websocket handshake data.
   * @param {{ client: Socket }} params - Socket params
   * @returns {string} - Access token
   */
  private extractAccessToken(params: { client: AuthenticatedSocket }): string {
    const { client } = params;
    const authToken: unknown = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }
    const authorizationHeader: string | undefined =
      client.handshake.headers.authorization;
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new Error('Authorization header missing');
    }
    return authorizationHeader.replace('Bearer ', '').trim();
  }
}
