#!/bin/bash
set -e

DOMAIN="xavioverland.com"

echo "===================================================================="
echo "🔐 CONFIGURADOR AUTOMÁTICO DE SSL / HTTPS (Let's Encrypt)"
echo "   Dominio objetivo: https://$DOMAIN y https://www.$DOMAIN"
echo "===================================================================="

# Asegurar que los contenedores SIEMPRE se levanten al salir, incluso si hay error
trap 'echo "🚀 Levantando contenedores..."; sudo docker compose up -d' EXIT

# 1. Instalar Certbot si no está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot en Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# 2. Detener contenedores temporalmente para liberar los puertos 80 y 443
echo "🛑 Liberando puertos para validar el dominio con Let's Encrypt..."
sudo docker compose down || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 443/tcp 2>/dev/null || true

# 3. Solicitar certificado SSL gratuito oficial de Let's Encrypt
echo "📜 Solicitando certificado oficial a Let's Encrypt para $DOMAIN y www.$DOMAIN..."
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email || \
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email

# 4. Copiar certificados al directorio local de Docker
echo "📁 Vinculando certificados a Docker..."
mkdir -p ./certs
sudo cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./certs/fullchain.pem 2>/dev/null || sudo cp -L /etc/letsencrypt/live/*/fullchain.pem ./certs/fullchain.pem
sudo cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem ./certs/privkey.pem 2>/dev/null || sudo cp -L /etc/letsencrypt/live/*/privkey.pem ./certs/privkey.pem
sudo chmod 644 ./certs/fullchain.pem ./certs/privkey.pem
sudo chmod 755 ./certs

# 5. Levantar todos los contenedores con el nuevo certificado
echo "🚀 Levantando contenedores en segundo plano..."
sudo docker compose up -d

echo "===================================================================="
echo "🎉 ¡PROCESO COMPLETADO!"
echo "👉 Acceso Seguro: https://$DOMAIN"
echo "👉 Acceso con www: https://www.$DOMAIN"
echo "👉 Acceso por IP:  http://107.20.0.5"
echo "===================================================================="
