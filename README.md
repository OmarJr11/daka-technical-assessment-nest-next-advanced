# Prueba Tecnica Full-Stack: NestJS + Next.js + Docker

Repositorio de la solucion para la prueba tecnica de Tiendas DAKA.

## Documentacion de referencia

- `TECHNICAL_ASSESSMENT.md`: alcance funcional, entregables y criterios.
- `OWASP_REQUIREMENTS.md`: checklist y practicas de seguridad requeridas.

## Stack

- Backend: NestJS, TypeORM, PostgreSQL, Redis, BullMQ, Socket.IO.
- Frontend: Next.js, React, Zustand, React Hook Form, Zod.
- Infraestructura: Docker, Docker Compose, multi-stage builds.

## Estructura del proyecto

El proyecto usa una estructura simple por features.

### Backend (`backend/src`)

```text
src/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  auth/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    decorators/
    dto/
    entities/
    responses/
    strategies/
  pokemon/
    pokemon.controller.ts
    pokemon.gateway.ts
    pokemon.module.ts
    pokemon.processor.ts
    pokemon.queue-events.listener.ts
    constants/
    interfaces/
  config/
  database/
  migrations/
```

Convenciones backend:

- Un dominio de negocio por carpeta (`auth`, `pokemon`).
- Transporte en controllers/gateways y logica de negocio en services.
- Constantes e interfaces cerca del dominio que las usa.
- Infraestructura compartida en `config` y `database`.

### Frontend (`frontend/src`)

```text
src/
  app/
    auth-bootstrap.tsx
    dashboard/page.tsx
    login/page.tsx
    register/page.tsx
    layout.tsx
    page.tsx
  features/
    auth/
      pages/
        login-page.tsx
        register-page.tsx
    pokemon/
      dashboard/
        components/
        constants/
        hooks/
  lib/
  store/
  proxy.ts
```

Convenciones frontend:

- Archivos de ruta en `app/*` delgados y de orquestacion.
- Logica y componentes por feature en `features/<feature-name>`.
- Utilidades globales en `lib` y estado compartido en `store`.

## Requisitos previos

- Docker + Docker Compose.
- Node.js 20+ (solo si quieres correr sin Docker).

## Variables de entorno

### 1) Raiz del repositorio

```bash
cp .env.example .env
```

Variables principales en `.env`:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_INITDB_ARGS`
- `FRONTEND_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `STORAGE_SECRET_KEY`

### 2) Backend y Frontend (modo local sin Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Variables clave backend:

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRATION_TIME`
- `BCRYPT_SALT_ROUNDS`
- `DATABASE_*`
- `THROTTLE_TTL`
- `THROTTLE_LIMIT`

Variables clave frontend:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_URL`

## Como ejecutar el proyecto

### Opcion A: Docker desarrollo (hot reload)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Servicios:

- Frontend: <http://localhost:3001>
- Backend API: <http://localhost:3000>
- Swagger: <http://localhost:3000/api/docs>
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Opcion B: Docker test/produccion

```bash
docker-compose -f docker-compose.test.yml up --build
```

Servicios:

- Frontend: <http://localhost:3001>
- Backend API: <http://localhost:3000>

### Opcion C: Ejecucion local (sin Docker)

1. Levanta PostgreSQL y Redis.
2. Configura `backend/.env` y `frontend/.env`.
3. Instala y ejecuta backend:

```bash
cd backend
npm ci
npm run start:dev
```

4. Instala y ejecuta frontend:

```bash
cd frontend
npm ci
npm run dev
```

## Pruebas

### Backend

```bash
cd backend
npm run test
npm run test:e2e
npm run test:cov
```

### Frontend

```bash
cd frontend
npm run test:unit
npm run test:e2e
```

## Decisiones tecnicas tomadas

### Autenticacion y sesiones

- Se uso `bcrypt` para hash de contrasenas con `BCRYPT_SALT_ROUNDS`.
- Se usa JWT con expiracion (`JWT_EXPIRATION_TIME`) y secret por variable de entorno.
- Se eligio cookie `httpOnly` (`accessToken`) en login para reducir exposicion a XSS.
- La estrategia JWT permite token tanto por `Authorization: Bearer` como por cookie.
- Se implemento endpoint de logout para invalidar sesion del cliente (clear cookie).

### Seguridad (OWASP)

- Validacion de payloads con DTO + `class-validator`.
- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
- CORS restringido por origen configurable (`FRONTEND_URL`) y `credentials: true`.
- Errores controlados con excepciones HTTP y logging interno.
- WebSocket con validacion de JWT al conectar y desconexion si el token no es valido.
- Rate limiting en login para mitigar fuerza bruta.

### Pokemon en tiempo real

- Las solicitudes de sprite se encolan en Redis con BullMQ.
- El worker descarga el sprite y lo guarda en storage local (`./storage`).
- El backend no expone URL directa de PokeAPI; genera URL firmada con expiracion.
- Las respuestas se emiten por WebSocket a una sala por usuario autenticado.

### Infraestructura

- Compose de desarrollo con volumenes para hot reload.
- Compose de test/produccion sin montar codigo fuente.
- Healthchecks para PostgreSQL y Redis.
- Dependencias entre servicios usando `condition: service_healthy` donde aplica.

## Notas de entrega

- Se incluye documentacion de ejecucion y decisiones en este `README.md`.
- Si se requiere detalle extendido por modulo, se puede complementar en `SOLUTION.md`.
