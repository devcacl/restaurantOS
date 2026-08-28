# 🍽️ RestaurantOS — Sistema de Gestión Multi-Tenant

**Versión:** 1.0  
**Stack:** React 18 + Vite + Tailwind CSS + NestJS 10 + Prisma ORM + PostgreSQL / SQLite  

---

## 📑 Visión General

RestaurantOS es un sistema multi-tenant de gestión de restaurantes de nivel empresarial que abarca menú, mesas, comanda digital (POS), pantalla de cocina (KDS), inventario, compras a proveedores, cobranza y analítica ejecutiva.

### 🌟 Características Clave
- **Multi-Tenancy Restricto:** Aislamiento total de datos por tenant validado vía `TenantGuard` en NestJS.
- **23 Tablas Relacionales:** Esquema Prisma completo con Soft Delete, SKU único por restaurante e índices relacionales.
- **POS & Comanda en Vivo:** Selección táctil de mesas, toma de pedidos, modificación de cantidades y notas especiales.
- **Kitchen Display System (KDS):** Tablero en tiempo real para estaciones de cocina con estados `CONFIRMED` → `PREPARING` → `READY`.
- **Control de Inventarios & Alertas:** Movimientos `IN`, `OUT`, `ADJUSTMENT` y notificación automática de stock bajo.
- **Analítica KPI:** Gráficos con Recharts, ingresos totales, ticket promedio y listado de más vendidos.

---

## 🛠️ Instalación y Ejecución Local

### 1. Clonar e Instalar Dependencias
```bash
# Instalar dependencias backend
npm --prefix backend install

# Instalar dependencias frontend
npm --prefix frontend install
```

### 2. Base de Datos y Semilla Inicial (Prisma)
```bash
# Generar Cliente Prisma y empujar esquema
npm run prisma:generate
npm run prisma:db:push

# Poblar base de datos con datos de demostración ("El Perrazazo Grill & Bar")
npm run prisma:seed
```

### 3. Iniciar Servidores de Desarrollo
```bash
# Backend NestJS (http://localhost:3000/api/v1)
npm run dev:backend

# Documentación Swagger (http://localhost:3000/api/docs)

# Frontend React + Vite (http://localhost:5173)
npm run dev:frontend
```

---

## 👤 Credenciales de Demostración

| Rol | Email | Contraseña |
|---|---|---|
| **OWNER** | `admin@restaurantos.com` | `admin123` |

---

## 📐 Estructura de Proyectos

```
restaurantOS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma (23 Tablas Prisma)
│   │   └── seed.ts (Semilla demo)
│   ├── src/
│   │   ├── common/ (Guards, Decorators)
│   │   ├── modules/ (Auth, Restaurants, Products, Orders, Inventory, Purchases, Payments, Dashboard)
│   │   └── main.ts
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/ (Header, Sidebar)
│   │   ├── views/ (POS, KDS, Menu, Inventory, Purchases, Dashboard)
│   │   └── App.tsx
```
