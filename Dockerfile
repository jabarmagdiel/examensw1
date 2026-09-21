# Etapa 1: Construcción del Frontend y Dependencias
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar la aplicación para producción
COPY . .
RUN npm run build

# Etapa 2: Imagen de Producción Ligera
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copiar package.json y dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el build compilado y el servidor Express/WebSocket
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Puerto expuesto para AWS (App Runner, ECS, Elastic Beanstalk)
EXPOSE 8080

# Comando de inicio del servidor unificado
CMD ["node", "server.js"]
