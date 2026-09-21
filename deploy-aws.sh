#!/bin/bash
# ====================================================================
# Script de Despliegue Automatizado para AWS (EC2 / Lightsail / Ubuntu)
# CASE Enterprise Studio (PUDS) — Frontend + Backend + PostgreSQL 16
# ====================================================================

set -e

echo "🚀 Iniciando despliegue de CASE Enterprise Studio en AWS..."

# 1. Verificar o instalar Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado correctamente."
fi

# 2. Levantar los 3 servicios con Docker Compose (Postgres + Backend + Frontend)
echo "🐳 Construyendo y levantando contenedores (PostgreSQL 16, Backend API, Frontend Nginx)..."
docker compose down || true
docker compose up --build -d

# 3. Esperar que PostgreSQL y Backend estén listos
echo "⏳ Esperando inicio de la base de datos y la API..."
sleep 8

# 4. Verificar estado
docker compose ps

echo "===================================================================="
echo "🎉 ¡DESPLIEGUE EXITOSO EN AWS!"
echo "===================================================================="
echo "🌐 Frontend Web:        http://$(curl -s ifconfig.me):80"
echo "📡 Backend API:         http://$(curl -s ifconfig.me):3001"
echo "🩺 Health Check & BD:   http://$(curl -s ifconfig.me):3001/api/health"
echo "🐘 Base de Datos:       PostgreSQL 16 en puerto 5432 (case_db)"
echo "===================================================================="
