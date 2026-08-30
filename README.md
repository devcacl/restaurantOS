# 🍽️ RestaurantOS — Sistema de Gestión Multi-Tenant

[![NestJS](https://img.shields.io/badge/Backend-NestJS_10-E0234E?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Database_&_Auth-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

**RestaurantOS** es una plataforma integral multi-tenant de nivel empresarial para la gestión de restaurantes. Incluye Punto de Venta (POS), Pantalla de Cocina (KDS), Gestión de Menú y Productos, Control de Inventario, Administración de Personal, Analítica Financiera e Integración completa con **Supabase (Auth, Storage & PostgreSQL Cloud)**.

---

## 📑 Tabla de Contenidos
- [🌟 Características Clave](#-características-clave)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [👤 Credenciales de Demostración](#-credenciales-de-demostración)
- [🛠️ Instalación y Configuración Paso a Paso](#️-instalación-y-configuración-paso-a-paso)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [🔌 Documentación del API (Swagger)](#-documentación-del-api-swagger)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)

---

## 🌟 Características Clave

- 🔐 **Autenticación con Supabase Auth & JWT**:
  - Sincronización híbrida de usuarios entre Supabase Auth y la base de datos PostgreSQL.
  - Persistencia de sesión y renovación de perfil vía `/auth/me`.
  - Roles granulares (`OWNER`, `WAITER`, `COOK`).

- 🏬 **Arquitectura Multi-Tenant Restricta**:
  - Aislamiento completo de datos por restaurante y sucursal.
  - `TenantGuard` en NestJS para asegurar que ningún usuario pueda acceder a datos de otro tenant.

- 🛒 **Punto de Venta (POS) Táctil e Intuitivo**:
  - Búsqueda en tiempo real de platillos y bebidas.
  - Carrito interactivo con cálculo automático de totales y modificación de cantidades.
  - Envió inmediato de comandas a la cocina.

- 👨‍🍳 **Kitchen Display System (KDS)**:
  - Tablero en tiempo real para estaciones de cocina.
  - Transición fluida de estados del pedido: `PENDING` ➔ `IN_PREPARATION` ➔ `READY` ➔ `DELIVERED`.

- 🖼️ **Gestión del Menú & Supabase Storage**:
  - Carga y alojamiento de imágenes de productos directamente en Buckets de Supabase Storage.
  - Precios, disponibilidad, categorías y SKUs organizados.

- 📦 **Control de Inventario y Alertas**:
  - Seguimiento de existencias por sucursal.
  - Alertas automáticas de bajo stock e inventario crítico.

- 👥 **Gestión de Personal**:
  - Administración de empleados por rol y sucursal con estatus de cuenta (`ACTIVE`).

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD
    Client["Client (Frontend React 18 + Vite)"] -->|REST API (Axios/Fetch)| Backend["NestJS Backend API (Port 3000)"]
    Client -->|Realtime Gateway| Socket["WebSocket Gateway (Socket.IO)"]
    Client -->|Direct Auth / Storage| SupabaseSDK["Supabase JS SDK"]
    
    subgraph NestJS Core Architecture
        Backend --> JwtGuard["JwtAuthGuard & RolesGuard"]
        JwtGuard --> Controllers["Controllers & Services"]
        Controllers --> Prisma["Prisma ORM"]
        Controllers --> SupabaseService["Supabase Service (Admin SDK)"]
    end

    Prisma -->|PostgreSQL Protocol| SupabaseDB[("Supabase PostgreSQL DB")]
    SupabaseService -->|Storage Bucket| SupabaseCloud["Supabase Storage & Auth"]
```

---

## 👤 Credenciales de Demostración

La pantalla de login incluye un **Quick Demo Login** para alternar con 1 clic entre cualquier rol:

| Rol | Email | Contraseña | Descripción / Permisos |
|---|---|---|---|
| 👑 **OWNER** | `admin@restaurantos.com` | `admin123` | Acceso completo (POS, Productos, Inventario, Equipo, Dashboard). |
| 🍽️ **WAITER** | `waiter@restaurantos.com` | `waiter123` | Acceso al Punto de Venta (POS) y mapa de comandas. |
| 👨‍🍳 **COOK** | `cook@restaurantos.com` | `cook123` | Acceso a la Pantalla de Cocina (KDS) y actualización de pedidos. |

---

## 🛠️ Instalación y Configuración Paso a Paso

### 1. Clonar el Repositorio
```bash
git clone https://github.com/devcacl/restaurantOS.git
cd restaurantOS
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias del Backend
npm --prefix backend install

# Instalar dependencias del Frontend
npm --prefix frontend install
```

### 3. Configurar Variables de Entorno
Copia los archivos `.env.example` en sus respectivas carpetas:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 4. Base de Datos y Semillas (Prisma & Supabase)
```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Sincronizar el esquema con Supabase PostgreSQL
npm run prisma:db:push

# Ejecutar la semilla inicial de prueba ("El Perrazazo Grill & Bar")
npm run prisma:seed
```

### 5. Iniciar Servidores en Desarrollo
Abre dos terminales o ejecuta:

```bash
# Iniciar Backend NestJS (http://localhost:3000/api/v1)
npm run dev:backend

# Iniciar Frontend React + Vite (http://localhost:5173)
npm run dev:frontend
```

---

## ⚙️ Variables de Entorno

### Backend (`backend/.env`)
```env
PORT=3000
JWT_SECRET=super-secret-restaurant-os-key-2026

# Supabase PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:tu_password@db.tu_ref.supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:tu_password@db.tu_ref.supabase.co:5432/postgres?sslmode=require"

# Supabase API Credentials
SUPABASE_URL="https://tu_ref.supabase.co"
SUPABASE_ANON_KEY="tu_anon_key"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
SUPABASE_STORAGE_BUCKET="product-images"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://tu_ref.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

---

## 🔌 Documentación del API (Swagger)

Una vez iniciado el servidor backend, puedes acceder a la documentación interactiva OpenAPI/Swagger en:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 📁 Estructura del Proyecto

```
restaurantOS/
├── backend/                    # Servidor NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # Esquema PostgreSQL Prisma (23 entidades relacionales)
│   │   └── seed.ts             # Semilla inicial con roles y restaurante demo
│   ├── src/
│   │   ├── common/             # Guards (JWT, Roles), Decoradores y cliente Supabase
│   │   ├── modules/            # Módulos DDD (Auth, Users, Products, Orders, Tables, Inventory...)
│   │   ├── main.ts             # Bootstrapping de NestJS
│   │   └── app.module.ts       # Módulo raíz
├── frontend/                   # Aplicación Web React 18 + Vite
│   ├── src/
│   │   ├── api/                # Cliente Fetch e integración Supabase SDK
│   │   ├── components/         # LoginModal (Glassmorphism), Sidebar, Navbar
│   │   ├── context/            # AuthContext (Estado global de sesión)
│   │   └── views/              # POSView, ProductsView, InventoryView, TeamView
├── README.md                   # Documentación principal
└── docker-compose.yml          # Configuración opcional para Docker
```

---

<p align="center">
  Desarrollado con ❤️ usando <b>React 18</b>, <b>NestJS</b> y <b>Supabase</b>.
</p>
