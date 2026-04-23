# Project Structure (Simple, No Monorepo)

This project uses a simple feature-based structure, without monorepo layers.

## Backend (`backend/src`)

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

### Backend conventions

- Keep one business domain per folder (`auth`, `pokemon`).
- Keep transport in controllers/gateways; keep business logic in services.
- Keep constants and interfaces close to the domain that owns them.
- Keep shared infra in `config` and `database`.

## Frontend (`frontend/src`)

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

### Frontend conventions

- Keep route files in `app/*` thin and orchestration-only.
- Keep feature logic/components under `features/<feature-name>`.
- Keep global/shared utilities in `lib` and app-wide state in `store`.
