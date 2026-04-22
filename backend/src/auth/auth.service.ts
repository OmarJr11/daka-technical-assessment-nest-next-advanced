import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }


  // TODO: Implementar método de registro
  // Requisitos:
  // 1. Verificar que el usuario no exista (username único)
  // 2. Hashear la contraseña usando bcrypt con salt rounds >= 10
  // 3. Crear y guardar el nuevo usuario en la base de datos
  // 4. Retornar un mensaje de éxito
  // 5. Manejar errores apropiadamente (try/catch)
  async register(registerDto: RegisterDto) {
    // TODO: Implementar lógica de registro
    throw new Error('Method not implemented - Complete this functionality');
  }


  // TODO: Implementar método de validación de usuario
  // Requisitos:
  // 1. Buscar usuario por username
  // 2. Comparar contraseña usando bcrypt.compare()
  // 3. Retornar usuario (sin password) si es válido, null si no
  async validateUser(username: string, pass: string): Promise<any> {
    // TODO: Implementar validación de credenciales
    return null;
  }

  // TODO: Implementar método de login
  // Requisitos:
  // 1. Generar JWT token con payload { username, sub: userId }
  // 2. Retornar { accessToken, user }
  // 3. El token debe tener expiración (configurado en auth.module.ts)
  async login(user: any) {
    // TODO: Implementar generación de JWT
    throw new Error('Method not implemented - Complete this functionality');
  }


  getProfile(user: any) {
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (user) {
      const { password, ...result } = user;
      return result as User;
    }
    return null;
  }
}

