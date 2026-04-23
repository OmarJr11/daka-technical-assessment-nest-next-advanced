# Multi-Stage Build para Backend

# TODO: Completar STAGE 1 (Builder)
# Usa la imagen node:20-slim
# 1. Copiar package files
# 2. Instalar dependencias
# 3. Copiar código fuente
# 4. Compilar (npm run build)
FROM node:20-slim AS builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# TODO: Completar STAGE 2 (Production)
# Usa la imagen node:20-slim
# 1. Copiar package files
# 2. Instalar SOLO dependencias de producción (npm ci --only=production)
# 3. Copiar la carpeta 'dist' del stage builder
# 4. Configurar usuario no-root (USER node)
# 5. Exponer puerto 3000
# 6. Definir CMD
FROM node:20-slim AS production-deps

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM gcr.io/distroless/nodejs20-debian11:nonroot AS production

# HINT: Recuerda copiar dist de la etapa anterior:
# COPY --from=builder /usr/src/app/dist ./dist
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=production-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json
EXPOSE 3000
USER nonroot
CMD ["dist/main.js"]