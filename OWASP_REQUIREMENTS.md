# Requisitos de Seguridad - OWASP Top 10 (2021)

## 🔒 Introducción

Este documento detalla los requisitos de seguridad que **DEBES** implementar en la prueba técnica, basados en el OWASP Top 10 2021. El cumplimiento de estos requisitos representa el 25% de tu evaluación.

---

## A01:2021 – Broken Access Control

### ❌ Riesgos

- Acceso no autorizado a recursos protegidos
- Usuarios elevando privilegios
- Bypass de autenticación

### ✅ Implementaciones Requeridas

#### Backend

```typescript
// Proteger TODAS las rutas que requieren autenticación
@Controller('pokemon')
export class PokemonController {
    
    @Get()
    @UseGuards(AuthGuard('jwt'))  // ✅ Guardia obligatoria
    @ApiBearerAuth()
    findAll(@Request() req) {
        // Solo usuarios autenticados pueden acceder
        const userId = req.user.id;
        // ...
    }
}
```

#### Frontend

```typescript
// Route guards en router/index.ts
router.beforeEach((to, from, next) => {
    const token = /* obtener token de forma segura */;
    
    if (to.meta.requiresAuth && !token) {
        next('/login');  // ✅ Redirigir si no autenticado
    } else if (to.meta.requiresGuest && token) {
        next('/dashboard');  // ✅ Redirigir si ya autenticado
    } else {
        next();
    }
});
```

---

## A02:2021 – Cryptographic Failures

### ❌ Riesgos

- Contraseñas en texto plano
- Secretos hardcodeados
- Tokens sin cifrar
- Almacenamiento inseguro de datos sensibles

### ✅ Implementaciones Requeridas

#### 1. Hash de Contraseñas

```typescript
// ✅ SIEMPRE usar bcrypt
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;  // Mínimo recomendado

async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    
    const user = this.userRepository.create({
        username: dto.username,
        password: hashedPassword,  // ✅ Nunca guardar en texto plano
    });
    
    await this.userRepository.save(user);
}

async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}
```

#### 2. Secretos en Variables de Entorno

```typescript
// ❌ INCORRECTO - Secreto hardcodeado
const secret = 'secretKey';

// ✅ CORRECTO - Variable de entorno
const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
```

#### 3. JWT Seguro

```typescript
// auth.module.ts
JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET is required');
        }
        
        return {
            secret: secret,
            signOptions: { 
                expiresIn: '1h',  // ✅ Token con expiración
                algorithm: 'HS256'
            },
        };
    },
}),
```

#### 4. Almacenamiento Seguro de Tokens (Frontend)

> [!CAUTION]
> **Evalúa y documenta tu decisión**

**Opciones:**

| Método | Seguridad | XSS | CSRF | Recomendado |
|--------|-----------|-----|------|-------------|
| `localStorage` | ❌ Bajo | Vulnerable | Protegido | No |
| `sessionStorage` | ⚠️ Medio | Vulnerable | Protegido | Solo si no hay opción mejor |
| HTTP-Only Cookies | ✅ Alto | Protegido | Requiere SameSite | **Sí** |

**Implementación recomendada: HTTP-Only Cookies**

```typescript
// Backend: Enviar token en cookie
@Post('login')
async login(@Body() dto: LoginDto, @Res() response) {
    const { accessToken, user } = await this.authService.login(dto);
    
    response.cookie('accessToken', accessToken, {
        httpOnly: true,     // ✅ No accesible por JavaScript
        secure: true,       // ✅ Solo HTTPS (producción)
        sameSite: 'strict', // ✅ Protección CSRF
        maxAge: 3600000     // 1 hora
    });
    
    return response.json({ user });
}
```

---

## A03:2021 – Injection

### ❌ Riesgos

- SQL Injection
- NoSQL Injection
- Command Injection
- XSS (Cross-Site Scripting)

### ✅ Implementaciones Requeridas

#### 1. Validación de Entrada

```typescript
// DTO con validación estricta
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers and underscores'
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(100)
    password: string;
}
```

#### 2. Global Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // ✅ Elimina propiedades no definidas en DTO
    forbidNonWhitelisted: true, // ✅ Rechaza propiedades extras
    transform: true,
}));
```

#### 3. Uso Seguro de TypeORM

```typescript
// ✅ CORRECTO - TypeORM previene injection
const user = await this.userRepository.findOneBy({ 
    username: dto.username 
});

// ❌ NUNCA usar raw queries con input del usuario sin sanitizar
// await this.userRepository.query(`SELECT * FROM users WHERE username = '${username}'`);
```

---

## A04:2021 – Insecure Design

### ✅ Implementaciones Requeridas

1. **Separación de Ambientes**: dev y test (prod) con configuraciones diferentes
2. **Rate Limiting**: Prevenir fuerza bruta (opcional pero valorado)
3. **Validación de Business Logic**: Validar no solo datos sino lógica de negocio

---

## A05:2021 – Security Misconfiguration

### ❌ Riesgos

- CORS mal configurado
- Errores que revelan stack traces
- Configuraciones por defecto inseguras
- Servicios innecesarios expuestos

### ✅ Implementaciones Requeridas

#### 1. CORS Específico

```typescript
// main.ts
app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',  // ✅ Específico
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
});

// ❌ NUNCA usar:
// app.enableCors({ origin: '*' });
```

#### 2. WebSocket CORS

```typescript
// ✅ CORRECTO
@WebSocketGateway({ 
    cors: { 
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true 
    } 
})

// ❌ INCORRECTO
@WebSocketGateway({ cors: { origin: '*' } })
```

#### 3. Manejo de Errores sin Revelar Detalles

```typescript
// ✅ CORRECTO
try {
    // operación
} catch (error) {
    this.logger.error('Database error details', error);  // Log interno
    throw new InternalServerErrorException(
        'An error occurred. Please try again later'  // ✅ Mensaje genérico al usuario
    );
}

// ❌ INCORRECTO
catch (error) {
    throw new Error(error.message);  // ❌ Revela detalles internos
}
```

#### 4. Variables de Entorno

```typescript
// .env.example (sin valores reales)
JWT_SECRET=your-strong-secret-here-min-32-characters
DATABASE_PASSWORD=your-database-password
NODE_ENV=development

// .env (en .gitignore, con valores reales)
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
DATABASE_PASSWORD=StrongP@ssw0rd123
NODE_ENV=production
```

---

## A07:2021 – Identification and Authentication Failures

### ❌ Riesgos

- Contraseñas débiles permitidas
- Falta de rate limiting
- Mensajes de error que revelan si usuario existe
- Tokens que no expiran

### ✅ Implementaciones Requeridas

#### 1. Validación de Contraseña Robusta

```typescript
export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        { 
            message: 'Password must contain uppercase, lowercase, number and special character' 
        }
    )
    password: string;
}
```

#### 2. Mensajes de Error Genéricos

```typescript
// ✅ CORRECTO
async login(dto: LoginDto) {
    const user = await this.userRepository.findOneBy({ username: dto.username });
    
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
        // ✅ Mensaje genérico, no revela si usuario existe
        throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.generateToken(user);
}

// ❌ INCORRECTO
if (!user) {
    throw new NotFoundException('User not found');  // ❌ Revela que usuario no existe
}
if (!validPassword) {
    throw new UnauthorizedException('Invalid password');  // ❌ Revela que usuario existe
}
```

#### 3. JWT con Expiración

```typescript
signOptions: { 
    expiresIn: '1h'  // ✅ Token expira en 1 hora
}
```

#### 4. Rate Limiting (Valorado)

```typescript
// Instalación: npm install @nestjs/throttler

// app.module.ts
ThrottlerModule.forRoot([{
    ttl: 60000,  // 60 segundos
    limit: 10,   // 10 requests máximo
}]),

// auth.controller.ts
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 intentos por minuto
async login(@Body() dto: LoginDto) {
    // ...
}
```

---

## A08:2021 – Software and Data Integrity Failures

### ✅ Implementaciones Requeridas

1. **Verificar integridad de dependencias**: Usar `package-lock.json`
2. **No ejecutar código no confiable**
3. **Validar datos de APIs externas**

```typescript
// Validar respuesta de PokeAPI
async getRandomSprite() {
    try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
        
        // ✅ Validar estructura de respuesta
        if (!response.data?.sprites?.front_default) {
            throw new Error('Invalid response from PokeAPI');
        }
        
        return {
            id: Date.now(),
            url: response.data.sprites.front_default,
            name: response.data.name
        };
    } catch (error) {
        this.logger.error('Error fetching pokemon', error);
        throw new BadGatewayException('Unable to fetch pokemon from external API');
    }
}
```

---

## A09:2021 – Security Logging and Monitoring Failures

### ✅ Implementaciones Requeridas

```typescript
// Usar Logger de NestJS
import { Logger } from '@nestjs/common';

export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    
    async login(dto: LoginDto) {
        this.logger.log(`Login attempt for user: ${dto.username}`);
        
        try {
            // ... lógica
            this.logger.log(`Successful login for user: ${dto.username}`);
        } catch (error) {
            this.logger.error(`Failed login for user: ${dto.username}`, error.stack);
            throw error;
        }
    }
}
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### ✅ Implementaciones Requeridas

```typescript
// ✅ CORRECTO - URL fija y confiable
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

async getRandomSprite() {
    const id = Math.floor(Math.random() * 898) + 1;
    
    // ✅ URL controlada, no usa input del usuario
    const url = `${POKEAPI_BASE}/pokemon/${id}`;
    
    const response = await axios.get(url);
    // ...
}

// ❌ NUNCA permitir URLs arbitrarias del usuario
// const url = req.body.pokemonUrl;  // ❌ Peligroso!
// await axios.get(url);
```

---

## 🎯 Checklist de Seguridad

Antes de entregar, verifica que hayas implementado:

- [ ] **Autenticación**: Hash de contraseñas con bcrypt
- [ ] **Autenticación**: JWT con expiración y secret en env
- [ ] **Autenticación**: Guards en todas las rutas protegidas
- [ ] **Validación**: DTOs con class-validator en todos los endpoints
- [ ] **Validación**: Global validation pipe configurado
- [ ] **CORS**: Configurado específicamente (no `*`)
- [ ] **Errores**: Try/catch en todas las operaciones async
- [ ] **Errores**: Mensajes genéricos al usuario, logs detallados
- [ ] **Secretos**: Todas las variables sensibles en .env
- [ ] **Secretos**: .env en .gitignore
- [ ] **WebSocket**: Autenticación JWT al conectar
- [ ] **WebSocket**: CORS específico
- [ ] **Logging**: Logger en operaciones críticas
- [ ] **Contraseñas**: Validación de complejidad

---

## 📚 Recursos Adicionales

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

---

> [!WARNING]
> El incumplimiento de estos requisitos resultará en una **reducción significativa** de tu puntuación. La seguridad no es opcional.

**¡Implementa seguridad desde el inicio, no como un afterthought!** 🔒
