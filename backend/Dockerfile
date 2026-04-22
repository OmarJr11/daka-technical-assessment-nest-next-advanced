# Multi-Stage Build para Backend

# TODO: Completar STAGE 1 (Builder)
# Usa la imagen node:20-slim
# 1. Copiar package files
# 2. Instalar dependencias
# 3. Copiar código fuente
# 4. Compilar (npm run build)
FROM node:20-slim AS builder

WORKDIR /usr/src/app
# ... completar aquí ...

# TODO: Completar STAGE 2 (Production)
# Usa la imagen node:20-slim
# 1. Copiar package files
# 2. Instalar SOLO dependencias de producción (npm ci --only=production)
# 3. Copiar la carpeta 'dist' del stage builder
# 4. Configurar usuario no-root (USER node)
# 5. Exponer puerto 3000
# 6. Definir CMD
FROM node:20-slim AS production

WORKDIR /usr/src/app
# ... completar aquí ...

# HINT: Recuerda copiar dist de la etapa anterior:
# COPY --from=builder /usr/src/app/dist ./dist