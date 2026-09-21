# ☁️ Guía Definitiva de Despliegue en AWS con Base de Datos PostgreSQL

Esta guía responde a la pregunta clave: **¿Cuál arquitectura conviene más para desplegar el Frontend, Backend y PostgreSQL en AWS?**

---

## 🏆 ¿Cuál te recomiendo? Comparativa Rápida

| Criterio | Opción A: Contenerizado Monolítico (Docker Compose en EC2 / Lightsail) ⭐ **(RECOMENDADA)** | Opción B: Cloud-Native Desacoplado (Amplify + App Runner + AWS RDS PostgreSQL) |
| :--- | :--- | :--- |
| **Ideal para** | **Exámenes, defensas de grado, proyectos de software y demos rápidas.** | **SaaS en producción masiva con miles de usuarios concurrentes.** |
| **Costo mensual** | **$0.00 USD** (Capa Gratuita Free Tier EC2 `t3.micro`) o **$3.50 USD** en Lightsail. | **$18 - $30 USD/mes** (AWS RDS fuera del Free Tier genera costo por hora). |
| **Tiempo de despliegue** | **5 minutos** (1 solo comando: `docker compose up -d`). | **30 - 45 minutos** (Crear RDS, VPC, Subnets, Security Groups y App Runner). |
| **Seguridad de la BD** | **Muy alta**: PostgreSQL vive en una red Docker privada interna (`case_network`), inaccesible desde el internet público. | Requiere configurar reglas de Security Group para permitir tráfico de App Runner a RDS. |
| **Mantenimiento** | Cero configuración externa. Tablas y seeders se cargan solos con `backend/init.sql`. | Requiere conectarse con DBeaver/pgAdmin a la instancia RDS para correr scripts. |

---

## 🚀 Opción A: Despliegue Recomendado (Docker Compose en AWS Lightsail o EC2)

Esta opción despliega **Frontend (Nginx), Backend (Node.js API + WebSockets) y PostgreSQL 16** juntos en una sola máquina virtual de AWS, orquestados limpiamente por Docker.

### Paso 1: Crear la instancia en AWS
1. Entra a la consola de **AWS Lightsail** (o **AWS EC2**).
2. Selecciona:
   - **Plataforma:** Linux / Unix
   - **Plano:** Solo SO ➔ **Ubuntu 22.04 LTS** o **24.04 LTS**.
   - **Tamaño:** Instancia de $3.50 o $5.00 USD (o `t3.micro`/`t3.small` en EC2).
3. En la pestaña **Networking (Redes)** de la instancia, abre los siguientes puertos en el Firewall:
   - **HTTP (Puerto 80)** ➔ Para el Frontend web.
   - **Custom (Puerto 3001)** ➔ Para la API Backend y WebSockets.
   - **SSH (Puerto 22)** ➔ Para conectarte por consola.

### Paso 2: Conectarte y Desplegar (1 Solo Comando)
Conéctate por SSH (o pulsa el botón *"Conectar mediante SSH"* del navegador en AWS) y ejecuta:

```bash
# 1. Clonar el repositorio
git clone <URL_DE_TU_REPOSITORIO> app
cd app

# 2. Ejecutar el script automatizado
chmod +x deploy-aws.sh
./deploy-aws.sh
```

El script instalará Docker, compilará el Frontend con Nginx, levantará PostgreSQL 16 inicializando automáticamente todas las tablas con `backend/init.sql`, y arrancará el Backend con WebSockets.

### Paso 3: Verificar que todo esté funcionando
Abre en tu navegador la IP pública de tu instancia AWS:
- **Frontend Web:** `http://<IP_PUBLICA_AWS>:80`
- **Backend API & Sockets:** `http://<IP_PUBLICA_AWS>:3001`
- **Salud de la BD y Backend:** `http://<IP_PUBLICA_AWS>:3001/api/health`
  *(Verás `database: { engine: "PostgreSQL", connected: true, status: "ONLINE" }`)*

---

## 🌐 Opción B: Despliegue con AWS RDS (Base de Datos Gestionada)

Si en tu examen o empresa te exigen obligatoriamente usar el servicio gestionado **AWS RDS PostgreSQL**:

### Paso 1: Crear la Base de Datos en AWS RDS
1. En la consola de AWS, busca **Amazon RDS** ➔ **Create database**.
2. Elige:
   - **Engine:** PostgreSQL (versión 16.x).
   - **Templates:** Free tier (Capa gratuita).
   - **DB instance identifier:** `case-enterprise-db`
   - **Master username:** `postgres`
   - **Master password:** `TuPasswordSeguro2026`
   - **Public access:** Yes (para pruebas) o dentro de la misma VPC.
3. Copia el **Endpoint** que te da RDS al terminar de crearse (ejemplo: `case-enterprise-db.c123.us-east-1.rds.amazonaws.com`).

### Paso 2: Cargar el Esquema y Seeders a RDS
Conéctate a tu base de datos RDS con DBeaver o `psql` y ejecuta el script:
[`backend/init.sql`](backend/init.sql)

### Paso 3: Conectar el Backend a RDS
En la variable de entorno de tu servidor o en tu archivo `.env`, configura:
```bash
DATABASE_URL=postgres://postgres:TuPasswordSeguro2026@case-enterprise-db.c123.us-east-1.rds.amazonaws.com:5432/case_db
```
El backend detectará la URL automáticamente y se conectará al cluster de AWS RDS.

---

## 🗄️ Resumen de Credenciales de PostgreSQL (Por Defecto)

- **Base de Datos:** `case_db`
- **Usuario:** `postgres`
- **Contraseña:** `casepassword2026`
- **Puerto:** `5432`
- **Tablas Pre-cargadas:**
  - `system_users` (Roles PUDS: Migue, Sofía, Alex, Carlos)
  - `projects` (Sistema de Gestión Veterinaria)
  - `clientes`, `veterinarios`, `mascotas`, `citas_medicas` (con datos de prueba en español)
