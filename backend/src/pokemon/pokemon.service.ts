import { Injectable } from '@nestjs/common';

@Injectable()
export class PokemonService {
  // TODO: Definir estructura para almacenar sprites
  // Puedes usar un array en memoria o considerar usar una base de datos
  // Ejemplo: private sprites: PokemonSprite[] = [];

  // TODO: Implementar método getRandomSprite()
  // Requisitos:
  // 1. Generar ID aleatorio entre 1 y 898
  // 2. Hacer request a PokeAPI: https://pokeapi.co/api/v2/pokemon/{id}
  // 3. Extraer sprite URL (sprites.front_default) y nombre (name)
  // 4. Manejar errores con try/catch apropiadamente
  // 5. Si PokeAPI falla, lanzar BadGatewayException con mensaje user-friendly
  // 6. Retornar objeto { id: timestamp, url: string, name: string }
  // 7. Opcionalmente: Almacenar el sprite en memoria
  async getRandomSprite(): Promise<any> {
    // TODO: Implementar integración con PokeAPI
    throw new Error('Method not implemented - Complete PokeAPI integration');
  }

  // HINT: Puedes necesitar estos métodos para gestionar sprites
  create(dto: any) {
    // TODO: Implementar si necesitas crear sprites manualmente
  }

  findAll() {
    // TODO: Retornar todos los sprites almacenados
    return [];
  }

  findOne(id: number) {
    // TODO: Buscar sprite por ID
    return null;
  }

  update(id: number, dto: any) {
    // TODO: Actualizar sprite si es necesario
  }

  remove(id: number) {
    // TODO: Eliminar sprite por ID
    return { deleted: true, id };
  }

  removeAll() {
    // TODO: Limpiar todos los sprites
    return { deleted: true, count: 0 };
  }
}
