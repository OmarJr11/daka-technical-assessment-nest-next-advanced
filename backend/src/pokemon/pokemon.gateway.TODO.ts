// TODO: Crear este archivo - PokemonGateway con WebSocket
// Este archivo debe implementar comunicación en tiempo real usando Socket.io
//
// Requisitos:
// 1. Usar decorador @WebSocketGateway() con CORS configurado
// 2. Implementar OnGatewayConnection y OnGatewayDisconnect
// 3. AUTENTICAR conexiones WebSocket validando JWT token
// 4. Implementar evento 'request-sprite':
//    - Llam ar a pokemonService.getRandomSprite()
//    - Emitir el resultado al cliente con evento 'sprite-served'
//    - Manejar errores apropiadamente
// 5. Implementar evento 'delete-sprite' si es necesario
//
// Ejemplo de estructura:
//
// import { WebSocketGateway, SubscribeMessage, OnGatewayConnection } from '@nestjs/websockets';
// import { Socket } from 'socket.io';
// import { JwtService } from '@nestjs/jwt';
// import { PokemonService } from './pokemon.service';
//
// @WebSocketGateway({ cors: { origin: /* configurar */ } })
// export class PokemonGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   constructor(
//     private readonly pokemonService: PokemonService,
//     private readonly jwtService: JwtService
//   ) {}
//
//   async handleConnection(client: Socket) {
//     // TODO: Validar JWT token del cliente
//     // Si no es válido, desconectar: client.disconnect()
//   }
//
//   handleDisconnect(client: Socket) {
//     // TODO: Manejar desconexión
//   }
//
//   @SubscribeMessage('request-sprite')
//   async requestSprite(client: Socket) {
//     // TODO: Implementar lógica
//   }
// }
