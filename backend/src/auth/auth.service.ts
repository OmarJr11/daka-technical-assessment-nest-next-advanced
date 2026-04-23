import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { authResponse } from './responses/auth.response';

type AuthResponse = {
  accessToken: string;
  user: User;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private authResponse = authResponse;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // TODO: Implementar método de registro
  // Requisitos:
  // 1. Verificar que el usuario no exista (username único)
  // 2. Hashear la contraseña usando bcrypt con salt rounds >= 10
  // 3. Crear y guardar el nuevo usuario en la base de datos
  // 4. Retornar un mensaje de éxito
  // 5. Manejar errores apropiadamente (try/catch)
  /**
   * Register a new user
   * @param {RegisterDto} registerDto - Register user dto
   * @returns {Promise<AuthResponse>} - Auth response with bearer token
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const { username, password } = registerDto;
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      this.logger.error(`User ${username} already exists`);
      throw new BadRequestException(
        this.authResponse.register.invalidCredentials,
      );
    }

    const hashedPassword = await this.hashPassword(password);
    try {
      const user: User = this.userRepository.create({
        username,
        password: hashedPassword,
      });
      const savedUser: User = await this.userRepository.save(user);
      return this.formatUser(savedUser);
    } catch (error) {
      this.logger.error(`Database error details`, error);
      throw new InternalServerErrorException(
        this.authResponse.register.failedToRegister,
      );
    }
  }

  // TODO: Implementar método de login
  // Requisitos:
  // 1. Generar JWT token con payload { username, sub: userId }
  // 2. Retornar { accessToken, user }
  // 3. El token debe tener expiración (configurado en auth.module.ts)
  /**
   * Login user
   * @param {User} user - User to login
   * @returns {Promise<AuthResponse>} - Auth response with bearer token
   */
  async login(user: User): Promise<AuthResponse> {
    const payload: { username: string; sub: number } = {
      username: user.username,
      sub: user.id,
    };
    try {
      const accessToken: string = await this.jwtService.signAsync(payload);
      return { accessToken, user };
    } catch (error) {
      this.logger.error(`JWT error details`, error);
      throw new UnauthorizedException(this.authResponse.login.failedToLogin);
    }
  }

  /**
   * Validate user credentials and return the public user.
   * @param {string} username - Username to validate
   * @param {string} pass - Plain text password
   * @returns {Promise<User>} - User
   */
  async validateUser(username: string, pass: string): Promise<User> {
    const user: User = await this.getUserByUsername(username, true);
    if (!(await this.comparePassword(pass, user.password as string))) {
      this.logger.error(`Invalid password for user ${username}`);
      throw new UnauthorizedException(
        this.authResponse.login.invalidCredentials,
      );
    }
    const formattedUser = this.formatUser(user);
    return formattedUser;
  }

  /**
   * Get user profile
   * @param {User} user - User to get profile
   * @returns {User} - User profile
   */
  async getProfile(user: User): Promise<User> {
    return await this.getUserById(user.id);
  }

  /**
   * Get user by id
   * @param {number} id - Id to get user
   * @returns {Promise<User>} - User
   */
  async getUserById(id: number): Promise<User> {
    try {
      return await this.userRepository.findOneByOrFail({ id });
    } catch (error) {
      this.logger.error(`Error getting user by id ${id}`, error);
      throw new BadRequestException(this.authResponse.login.notFound);
    }
  }

  /**
   * Get user by username
   * @param {string} username - Username to get user
   * @param {boolean} selectPassword - Select password
   * @returns {Promise<User>} - User
   */
  async getUserByUsername(
    username: string,
    selectPassword: boolean = false,
  ): Promise<User> {
    try {
      const query = this.userRepository.createQueryBuilder('user');
      if (selectPassword) {
        query.addSelect('user.password');
      }
      return await query
        .where('user.username = :username', { username })
        .getOneOrFail();
    } catch (error) {
      this.logger.error(`Error getting user by username ${username}`, error);
      throw new BadRequestException(this.authResponse.login.invalidCredentials);
    }
  }

  /**
   * Hash password
   * @param {string} password - Password to hash
   * @returns {Promise<string>} - Hashed password
   */
  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    );
  }

  /**
   * Compare password
   * @param {string} password - Password to compare
   * @param {string} hashedPassword - Hashed password to compare
   * @returns {Promise<boolean>} - True if password is valid
   */
  private comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Format user
   * @param {User} user - User to format
   * @returns {User} - Formatted user
   */
  private formatUser(user: User): User {
    delete user?.password;
    return user;
  }
}
