# CASE-AI Studio — Herramienta CASE Colaborativa con IA (PUDS)

Plataforma integral de **Ingeniería de Software Asistida por Computadora (CASE)** desarrollada bajo la metodología **PUDS** (Proceso Unificado de Desarrollo de Software) cubriendo las fases de diseño de datos (DER Conceptual, Lógico, Físico, Diagrama de Clases UML y Normalización de 1FN a BCNF) y generación de código backend Spring Boot 3 con cliente frontend React para pruebas presenciales.

---

## 🌟 Características Principales

1. **Diseño y Modelado de Datos**:
   - Vistas: DER Conceptual, DER Lógico, DER Físico y Diagrama de Clases UML.
   - Lienzo interactivo fluido con conectores SVG, cardinalidades (`1:1`, `1:N`, `N:M`), zoom, pan y edición de entidades.
2. **Motor de Normalización Formal (1FN a BCNF)**:
   - Especificación manual de Dependencias Funcionales ($X \rightarrow Y$).
   - Algoritmo formal de clausura de atributos ($X^+$) y cálculo de claves candidatas mínimas.
   - Diagnóstico paso a paso de 1FN, 2FN, 3FN y BCNF con sugerencias de descomposición aplicables al lienzo.
3. **Interoperabilidad Bidireccional Completa con Enterprise Architect & Archi**:
   - **Exportación**: Formato OMG XMI 2.1 estándar de UML para Sparx Enterprise Architect y Open Exchange XML para Archi.
   - **Importación**: Lectura y mapeo automático de modelos externos al lienzo.
4. **Colaboración Multiusuario (3 Sesiones PUDS)**:
   - Servidor WebSocket en tiempo real con presencia, awareness y cursores remotos.
   - 3 roles metodológicos: **Analista**, **Diseñador**, e **Implementador**.
   - Simulador integrado de actividad concurrente en vivo para demostración en el examen.
5. **IA Multimodal & Asistente Móvil Voice-Only**:
   - Asistente de voz tipo móvil sin GUI compleja visual.
   - **Buffer Offline**: almacenamiento local persistente de comandos ante pérdida de conexión y sincronización en ráfaga (burst sync) al reconectar.
   - Chat asistente de modelado y digitalización de fotos/bocetos de diagramas.
6. **Generador Dual de Código**:
   - Backend Spring Boot 3 en `.zip` con Maven, JPA Entities, Repositories, Services, REST Controllers y Colección Postman.
   - Frontend React CRUD interactivo para pruebas presenciales inmediatas.

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- Node.js v18+ (probado en v24)
- npm v9+

### Ejecución de Servidores
En dos terminales independientes:
```bash
# 1. Iniciar servidor de colaboración WebSocket (puerto 3001)
npm run server

# 2. Iniciar aplicación web CASE-AI Studio (puerto 5173)
npm run dev
```

Abre tu navegador en: **http://localhost:5173/**

---

## 👥 Estructura de Roles PUDS Implementada
- **Analista (Azul)**: Requisitos del dominio, modelado conceptual y dependencias funcionales.
- **Diseñador (Púrpura)**: Esquema lógico, diagramas de clases UML, cardinalidades y normalización.
- **Implementador (Esmeralda)**: Esquema físico, tipos SQL, generación de código Spring Boot y pruebas API.
