#!/bin/bash
set -e

DOMAIN="xavioverland.com"
EMAIL="migue.analista@case-enterprise.com"

echo "===================================================================="
echo "🔐 CONFIGURADOR AUTOMÁTICO DE SSL / HTTPS (Let's Encrypt)"
echo "   Dominio objetivo: https://$DOMAIN y https://www.$DOMAIN"
echo "===================================================================="

# 1. Instalar Certbot si no está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot en Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# 2. Detener temporalmente los contenedores para que el puerto 80 quede libre para la validación de Let's Encrypt
echo "🛑 Liberando puerto 80 para validar el dominio con Let's Encrypt..."
sudo docker compose down || true

# 3. Solicitar certificado SSL gratuito
echo "📜 Solicitando certificado oficial gratuito a Let's Encrypt..."
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email || sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email

# 4. Copiar certificados al directorio local de Docker
echo "📁 Vinculando certificados a Docker..."
mkdir -p ./certs
sudo cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./certs/fullchain.pem
sudo cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem ./certs/privkey.pem
sudo chmod -R 755 ./certs

# 5. Activar configuración de Nginx con SSL
echo "⚙️ Configurando Nginx con soporte HTTPS..."
cp ./frontend/nginx-ssl.conf ./frontend/nginx.conf

# 6. Levantar contenedores con puertos 80 y 443 activos
echo "🚀 Levantando servicios en Docker con HTTPS..."
sudo docker compose -f docker-compose.yml -f docker-compose.ssl.yml up --build -d

echo "===================================================================="
echo "🎉 ¡FELICITACIONES! HTTPS ESTÁ ACTIVO CON CANDADITO DE SEGURIDAD"
echo "👉 Web Segura: https://$DOMAIN"
echo "👉 Con www:    https://www.$DOMAIN"
echo "===================================================================="
