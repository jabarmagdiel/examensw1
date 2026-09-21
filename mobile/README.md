# 📱 Aplicación Móvil Android (APK) — CASE Voice AI

Aplicación móvil Android diseñada para el **relleno de datos por voz mediante IA Local**, compatible con los backends generados (Spring Boot 3 / PostgreSQL / MySQL) y con funcionamiento **100% Offline y Online**.

---

## 📦 Descarga Inmediata del APK

El archivo APK compilado para Android se encuentra listo en este directorio y en la plataforma web:
- **Ruta local:** [`mobile/apk/case-voice-mobile.apk`](case-voice-mobile.apk)
- **Ruta web descargable:** `/downloads/case-voice-mobile.apk`
- **Tamaño:** ~49.3 MB (Arquitecturas ARM64 / ARMv7 / x86_64)

### 📲 Instalación en Teléfono Android:
1. Pasa el archivo `case-voice-mobile.apk` a tu teléfono vía USB, WhatsApp, Google Drive o descargándolo desde el navegador web de la plataforma.
2. Abre el archivo en el teléfono y selecciona **Instalar**.
3. Si el sistema te lo pide, permite **"Instalar aplicaciones de fuentes desconocidas"**.
4. ¡Listo! Abre la app **CASE Voice AI**.

---

## 🧠 Características de la IA Local por Voz

1. **Reconocimiento y Procesamiento 100% Offline**:
   - Utiliza el motor de síntesis y reconocimiento de voz local del dispositivo móvil (Web Speech / Android Speech Engine).
   - Motor NLP determinista local que analiza la estructura de las tablas generadas por el backend y asocia los datos hablados a los campos exactos sin requerir conexión a internet.
2. **Buffer de Sincronización Offline (Queue)**:
   - Los registros dictados en zonas sin internet se guardan en el almacenamiento seguro local (`IndexedDB` / `localStorage`).
   - Al recuperar la señal Wi-Fi / 4G, se sincronizan en ráfaga (*burst sync*) mediante peticiones `POST` al backend Spring Boot (`http://localhost:8080/api/v1/{tabla}`).
3. **Comandos de Voz Admitidos en Español**:
   - *"Registrar cliente Carlos Mendoza con DNI 71829304 y teléfono 70011223"*
   - *"Agregar mascota Rocky especie Canino raza Golden Retriever"*
   - *"Crear veterinario Dra. Elena Ramos con matrícula VET-504"*
   - *"Nueva cita médica con motivo Consulta General y fecha 2026-09-25"*
