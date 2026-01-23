# BillForge 🚀

**Infraestructura de Facturación para Creadores de SaaS.**

![BillForge Dashboard](https://via.placeholder.com/1200x600?text=BillForge+Dashboard+Preview)

> "BillForge no es solo un panel de control; es una infraestructura de facturación headless diseñada para desarrolladores que necesitan control total sobre su lógica de suscripción sin reinventar la rueda."

---

## 📖 Sobre el Proyecto

BillForge resuelve el dilema de "Construir vs. Comprar" (Build vs. Buy) para la facturación en SaaS. Aunque herramientas como Stripe son potentes, a menudo requieren un esfuerzo de implementación significativo para manejar lógica de negocio como **gestión de cobros fallidos (dunning)**, **periodos de gracia** y **aislamiento multi-inquilino (multi-tenancy)**.

BillForge actúa como una **capa de middleware** que se sitúa entre tu aplicación y el procesador de pagos, proporcionando un motor robusto y con opinión propia para:

*   **Gestión del Ciclo de Vida de Suscripciones:** Máquinas de estado que manejan transiciones de `ACTIVE` → `PAST_DUE` → `GRACE_PERIOD` → `CANCELED`.
*   **Enfoque B2B SaaS:** Construido desde cero pensando en la multi-tenencia y la facturación a nivel de organización.
*   **Observabilidad Primero:** Cada trabajo (job), webhook y acción crítica se registra, audita y es rastreable.

## 🏗️ Arquitectura Técnica

El sistema está arquitecturado como un **monolito modular** con una clara separación de responsabilidades, diseñado para ser desplegado como un microservicio en un ecosistema más grande.

### Patrones de Diseño Clave
*   **Multi-Tenancy:** Aislamiento lógico usando `tenant_id` a nivel de base de datos asegurando la privacidad de los datos.
*   **Control de Acceso Basado en Roles (RBAC):** Permisos granulares para `SUPER_ADMIN` (Dueño de la Plataforma) vs `TENANT_OWNER` (Cliente SaaS).
*   **Arquitectura Orientada a Eventos:** Ingesta de Webhooks (Stripe) desacoplada del procesamiento de la lógica de negocio.
*   **Procesamiento en Segundo Plano:** Motor de trabajos personalizado para facturación recurrente y procesos de recuperación de cobros.

## ✨ Características Principales

### 🔌 Para Desarrolladores (API & Backend)
*   **API RESTful:** Endpoints totalmente tipados para gestionar suscripciones y facturas.
*   **Gestión de API Keys:** Los inquilinos pueden generar claves `sk_live_...` para integrar BillForge en sus propios backends.
*   **Observabilidad Estructurada:**
    *   **Audit Logs:** Registro inmutable de quién hizo qué (`user.login`, `plan.created`, `subscription.updated`).
    *   **Historial de Trabajos:** Logs de ejecución detallados para cron jobs (Facturación, Dunning).
*   **Seguridad:**
    *   `pgcrypto` para hashing de contraseñas a nivel de base de datos.
    *   `Helmet` y `Rate Limiting` para protección de la API.
    *   Tipado estricto de TypeScript con esquemas de validación `Zod`.

### 💻 Para Usuarios de Negocio (Frontend Dashboard)
*   **Panel de Administración Global:** Métricas en tiempo real sobre MRR (Ingresos Recurrentes Mensuales), ARR y Suscripciones Activas.
*   **Analítica de Ingresos:** Gráficos interactivos (Recharts) visualizando la distribución de ingresos por plan.
*   **Generación de Facturas:** Generación de PDF en el lado del cliente usando `jspdf-autotable`.
*   **Portal de Autoservicio:** Los usuarios pueden ver el estado de su plan, historial de pagos y descargar facturas.

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Uso |
|:--- |:--- |
| **Node.js & Express** | Servidor API Principal |
| **TypeScript** | Seguridad de Tipos y Experiencia de Desarrollo |
| **PostgreSQL** | Base de Datos Relacional e Integridad de Datos |
| **Stripe SDK** | Procesamiento de Pagos y Webhooks |
| **Zod** | Validación de Solicitudes en Tiempo de Ejecución |
| **JWT** | Autenticación Sin Estado (Stateless) |

### Frontend
| Tecnología | Uso |
|:--- |:--- |
| **React (Vite)** | Framework SPA |
| **Tailwind CSS** | Estilado Utility-first |
| **Recharts** | Visualización de Datos y Analítica |
| **Lucide React** | Iconografía Moderna |
| **Axios** | Comunicación con API |

### DevOps e Infraestructura
*   **CI/CD:** GitHub Actions (listo).
*   **Hosting:** Render / Railway / Vercel.
*   **Control de Versiones:** Git con Conventional Commits.

## 🗄️ Modelo de Base de Datos (Alto Nivel)

BillForge utiliza un modelo relacional optimizado para la integridad:

*   `Tenant` 1:N `AppUser` (Los usuarios pertenecen a organizaciones)
*   `Tenant` 1:N `Subscription` (Lógica de una suscripción activa por inquilino)
*   `Subscription` 1:N `Invoice` (Ciclos de facturación mensuales)
*   `Invoice` 1:N `Payment` (Intentos y reintentos)

## 🚀 Comenzando

### Prerrequisitos
*   Node.js v18+
*   PostgreSQL 14+
*   Cuenta de Stripe (Modo Test)

### Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/MateoDumas/BillForge.git
    cd BillForge
    ```

2.  **Configuración del Backend**
    ```bash
    npm install
    cp .env.example .env
    # Actualiza .env con tus credenciales de BD y Claves de Stripe
    npm run dev
    ```

3.  **Configuración del Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Acceder a la App**
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:3000`

## 🧪 Testing y Calidad

*   **Seguridad de Tipos:** Configuraciones estrictas de `tsconfig` para prevenir el uso de `any`.
*   **Manejo de Errores:** Middleware de errores centralizado con trazas de pila conscientes del entorno.
*   **Linting:** Configuración de ESLint para consistencia de código.

---

**Creado con ❤️ por [Mateo Dumas](https://github.com/MateoDumas)**
*Ingeniero de Software | Desarrollador Full Stack*
