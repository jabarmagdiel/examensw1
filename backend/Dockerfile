# Dockerfile para Backend (AWS App Runner / ECS / Lightsail)
FROM node:20-alpine

WORKDIR /app

# Copiar manifiesto e instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente del backend
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "src/index.js"]
