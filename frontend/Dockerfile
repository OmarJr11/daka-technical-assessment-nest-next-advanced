# Multi-Stage Build para Frontend (Next.js)

# TODO: STAGE 1 - Builder
# imagen base: node:20-slim o node:20-alpine
# pasos:
# 1. Instalar dependencias
# 2. Construir la app de Next.js (next build)
FROM node:20-slim AS builder
WORKDIR /app

# ... completar instalacion y build ...


# TODO: STAGE 2 - Production Server
# imagen base: node:20-slim o node:20-alpine
# pasos:
# 1. Copiar los archivos compilados del builder (ej: .next/standalone si está activado)
# 2. Exponer el puerto adecuado (ej. 3001)
# 3. Configurar comando de arranque (npm run start o node server.js)
FROM node:20-slim AS runner
WORKDIR /app

# ... completar copy y CMD ...
