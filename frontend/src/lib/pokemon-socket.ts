import { io, Socket } from "socket.io-client";
import type { PokemonSocketContract } from "@/lib/pokemon-socket-types";

type ClientToServerEvents = PokemonSocketContract["clientToServerEvents"];
type ServerToClientEvents = PokemonSocketContract["serverToClientEvents"];

type SocketConnectionParams = {
  token?: string;
  onConnectionStateChange?: (isConnected: boolean) => void;
  onConnectionError?: (message: string) => void;
};

const DEFAULT_SOCKET_URL: string =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

/**
 * Manages pokemon websocket connection lifecycle.
 */
class PokemonSocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  /**
   * Connects socket to backend gateway using optional JWT token.
   * @param {SocketConnectionParams} params - Connection params
   * @returns {Socket<ServerToClientEvents, ClientToServerEvents>} Active socket instance
   */
  connect(
    params: SocketConnectionParams = {},
  ): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket) {
      return this.socket;
    }
    const authPayload: { token?: string } = {};
    if (params.token) {
      authPayload.token = params.token;
    }
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      DEFAULT_SOCKET_URL,
      {
        withCredentials: true,
        auth: authPayload,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ["websocket", "polling"],
      },
    );
    socket.on("connect", (): void => {
      params.onConnectionStateChange?.(true);
    });
    socket.on("disconnect", (): void => {
      params.onConnectionStateChange?.(false);
    });
    socket.on("connect_error", (error: Error): void => {
      params.onConnectionError?.(error.message);
    });
    this.socket = socket;
    return socket;
  }

  /**
   * Returns current socket instance.
   * @returns {Socket<ServerToClientEvents, ClientToServerEvents> | null} Current socket
   */
  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  /**
   * Disconnects active socket and clears listeners.
   * @returns {void} No return
   */
  disconnect(): void {
    if (!this.socket) {
      return;
    }
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }
}

const pokemonSocketClient: PokemonSocketClient = new PokemonSocketClient();

export default pokemonSocketClient;
