# BillForge 🚀

**Billing Infrastructure for SaaS Builders.**

![BillForge Dashboard](https://via.placeholder.com/1200x600?text=BillForge+Dashboard+Preview)

> "BillForge is not just a dashboard; it's a headless billing infrastructure designed for developers who need full control over their subscription logic without reinventing the wheel."

---

## 📖 About The Project

BillForge solves the "Build vs. Buy" dilemma for SaaS billing. While tools like Stripe are powerful, they often require significant implementation effort to handle business logic like **dunning management (reintentos de cobro)**, **grace periods**, and **multi-tenant isolation**.

BillForge acts as a **middleware layer** that sits between your application and the payment processor, providing a robust, opinionated engine for:

*   **Subscription Lifecycle Management:** State machines handling transitions from `ACTIVE` → `PAST_DUE` → `GRACE_PERIOD` → `CANCELED`.
*   **B2B SaaS Focus:** Built from the ground up with multi-tenancy and organization-level billing in mind.
*   **Observability First:** Every job, webhook, and critical action is logged, audited, and traceable.

## 🏗️ Technical Architecture

The system is architected as a **modular monolith** with a clear separation of concerns, designed to be deployed as a microservice in a larger ecosystem.

### Key Design Patterns
*   **Multi-Tenancy:** Logical isolation using `tenant_id` at the database level ensuring data privacy.
*   **Role-Based Access Control (RBAC):** Granular permissions for `SUPER_ADMIN` (Platform Owner) vs `TENANT_OWNER` (SaaS Customer).
*   **Event-Driven Architecture:** Webhook ingestion (Stripe) decoupled from business logic processing.
*   **Background Processing:** Custom-built job engine for recurring billing and dunning processes.

## ✨ Key Features

### 🔌 For Developers (API & Backend)
*   **RESTful API:** Fully typed endpoints for managing subscriptions and invoices.
*   **API Key Management:** Tenants can generate `sk_live_...` keys to integrate BillForge into their own backends.
*   **Structured Observability:**
    *   **Audit Logs:** Immutable record of who did what (`user.login`, `plan.created`, `subscription.updated`).
    *   **Job History:** Detailed execution logs for cron jobs (Billing, Dunning).
*   **Security:**
    *   `pgcrypto` for database-level password hashing.
    *   `Helmet` & `Rate Limiting` for API protection.
    *   Strict TypeScript typing with `Zod` validation schemas.

### 💻 For Business Users (Frontend Dashboard)
*   **Global Admin Dashboard:** Real-time metrics on MRR (Monthly Recurring Revenue), ARR, and Active Subscriptions.
*   **Revenue Analytics:** Interactive charts (Recharts) visualizing income distribution by plan.
*   **Invoice Generation:** Client-side PDF generation using `jspdf-autotable`.
*   **Self-Service Portal:** Users can view their plan status, payment history, and download invoices.

## 🛠️ Tech Stack

### Backend
| Technology | Usage |
|:--- |:--- |
| **Node.js & Express** | Core API Server |
| **TypeScript** | Type Safety & Developer Experience |
| **PostgreSQL** | Relational Database & Data Integrity |
| **Stripe SDK** | Payment Processing & Webhooks |
| **Zod** | Runtime Request Validation |
| **JWT** | Stateless Authentication |

### Frontend
| Technology | Usage |
|:--- |:--- |
| **React (Vite)** | SPA Framework |
| **Tailwind CSS** | Utility-first Styling |
| **Recharts** | Data Visualization & Analytics |
| **Lucide React** | Modern Iconography |
| **Axios** | API Communication |

### DevOps & Infrastructure
*   **CI/CD:** GitHub Actions (ready).
*   **Hosting:** Render / Railway / Vercel.
*   **Version Control:** Git with Conventional Commits.

## 🗄️ Database Model (High Level)

BillForge uses a relational model optimized for integrity:

*   `Tenant` 1:N `AppUser` (Users belong to organizations)
*   `Tenant` 1:N `Subscription` (One active subscription per tenant logic)
*   `Subscription` 1:N `Invoice` (Monthly billing cycles)
*   `Invoice` 1:N `Payment` (Attempts and retries)

## 🚀 Getting Started

### Prerequisites
*   Node.js v18+
*   PostgreSQL 14+
*   Stripe Account (Test Mode)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/MateoDumas/BillForge.git
    cd BillForge
    ```

2.  **Backend Setup**
    ```bash
    npm install
    cp .env.example .env
    # Update .env with your DB credentials and Stripe Keys
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the App**
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:3000`

## 🧪 Testing & Quality

*   **Type Safety:** Strict `tsconfig` settings to prevent `any` usage.
*   **Error Handling:** Centralized error middleware with environment-aware stack traces.
*   **Linting:** ESLint configuration for code consistency.

---

**Built with ❤️ by [Mateo Dumas](https://github.com/MateoDumas)**
*Software Engineer | Full Stack Developer*
