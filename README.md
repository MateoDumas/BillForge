# BillForge 🚀

**Billing Infrastructure for SaaS Builders.**

BillForge no es solo un panel de administración; es la infraestructura de facturación que todo SaaS necesita. Diseñado para desarrolladores que construyen productos escalables, BillForge maneja la complejidad de suscripciones, pagos recurrentes y facturación automática para que tú te enfoques en tu producto principal.

## 💡 Concepto Técnico

> "Plataforma SaaS con facturación automática: servicio por suscripción que gestiona planes de usuario, facturación periódica (cron jobs), integrando pasarelas de pago y escalando los recursos según la demanda. Demuestra habilidades en diseño de modelo de datos y seguridad multiusuario."

![BillForge Dashboard](https://via.placeholder.com/800x400?text=BillForge+Dashboard+Preview)

## ✨ Características Principales

*   **📊 Dashboard Interactivo:** Visualización en tiempo real de ingresos, suscripciones activas y métricas clave.
*   **💳 Gestión de Suscripciones:** Creación y administración de planes de suscripción flexibles.
*   **🧾 Facturación Automatizada:** Generación de facturas profesionales en PDF y seguimiento de estados.
*   **💰 Procesamiento de Pagos:** Integración con sistemas de pago, manejo de reintentos y estados de transacción.
*   **🔑 Perfiles de Usuario y API Keys:** Gestión de perfil personal y generación de API Keys para integración directa como infraestructura.
*   **🛡️ Panel de Super Admin:** Herramientas avanzadas para la gestión global de la plataforma (métricas, planes, jobs).
*   **🔔 Notificaciones:** Sistema de alertas para eventos importantes (pagos fallidos, nuevas suscripciones).
*   **🌗 Modo Oscuro/Claro:** Interfaz adaptable a las preferencias del usuario.
*   **🔒 Seguridad:** Autenticación robusta y protección de datos.

## 👥 Roles y Acceso

BillForge maneja dos niveles principales de acceso:

1.  **Tenant Owner (Usuario Estándar):**
    *   Acceso al Dashboard de su organización.
    *   Gestión de suscripciones y facturas.
    *   **Nuevo:** Acceso a perfil de usuario y generación de API Keys (`/profile`).

2.  **Super Admin:**
    *   Acceso total a la plataforma.
    *   **Nuevo:** Panel de administración global (`/admin`) para métricas de negocio (MRR, Tenants), gestión de planes y triggers de jobs.

## 🛠️ Tecnologías Utilizadas

### Frontend
*   **React:** Biblioteca principal para la interfaz de usuario.
*   **Vite:** Empaquetador rápido y ligero.
*   **TypeScript:** Para un código más seguro y escalable.
*   **CSS Variables:** Para un sistema de temas dinámico (Dark Mode).

### Backend
*   **Node.js & Express:** Servidor robusto y API RESTful.
*   **PostgreSQL:** Base de datos relacional para integridad de datos.
*   **pgcrypto:** Para seguridad y hashing de contraseñas.
*   **JWT:** Autenticación segura basada en tokens.

## 🚀 Instalación y Configuración Local

Sigue estos pasos para correr el proyecto en tu máquina local:

### Prerrequisitos
*   Node.js (v16 o superior)
*   PostgreSQL

### 1. Clonar el repositorio

```bash
git clone https://github.com/MateoDumas/BillForge.git
cd BillForge
```

### 2. Configuración del Backend

Instala las dependencias:

```bash
npm install
```

Crea un archivo `.env` en la raíz con tus variables de entorno (puedes basarte en el ejemplo si existe, o usar tus credenciales de PostgreSQL):

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/billforge
JWT_SECRET=tu_secreto_super_seguro
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

### 3. Configuración del Frontend

Navega a la carpeta del frontend e instala dependencias:

```bash
cd frontend
npm install
```

Inicia el servidor de desarrollo del frontend:

```bash
npm run dev
```

El frontend estará disponible generalmente en `http://localhost:5173`.

## 🌍 Despliegue

### Backend (Railway)
El backend está configurado para desplegarse fácilmente en [Railway](https://railway.app/). Asegúrate de configurar las variables de entorno (`DATABASE_URL`, `JWT_SECRET`) en el panel de Railway.

### Frontend (Vercel)
El frontend se puede desplegar en [Vercel](https://vercel.com/). Simplemente importa el repositorio y Vercel detectará automáticamente la configuración de Vite.

## 📄 Páginas Legales
El proyecto incluye páginas predeterminadas para:
*   Términos y Condiciones
*   Política de Privacidad
*   Soporte

## 🤝 Contribución
Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para mejoras.

---
&copy; 2026 BillForge. Todos los derechos reservados.
