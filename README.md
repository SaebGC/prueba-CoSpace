# 🏢 CoSpace (cospace-nxt)

> Plataforma full-stack moderna y robusta para la gestión y reserva en tiempo real de espacios de Coworking (hot desks, salas de juntas y cabinas acústicas).

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Modelo de Datos (Prisma ORM)](#-modelo-de-datos-prisma-orm)
- [Reglas de Negocio Implementadas](#-reglas-de-negocio-implementadas)
- [Autenticación y Seguridad](#-autenticación-y-seguridad)
- [Referencia de la API REST](#-referencia-de-la-api-rest)
- [Puesta en Marcha (Desarrollo)](#-puesta-en-marcha-desarrollo)
- [Usuarios y Credenciales de Prueba](#-usuarios-y-credenciales-de-prueba)
- [Despliegue y Contenedores (Docker)](#-despliegue-y-contenedores-docker)

---

## 🚀 Visión General

**CoSpace** es una solución web diseñada para optimizar la ocupación de espacios de trabajo colaborativo. Proporciona:
- **Catálogo público** en tiempo real con renderizado del lado del servidor (SSR con `connection()` en Next.js 16).
- **Sistema de reservas automatizado** con validaciones estrictas de horarios, concurrencia, disponibilidad y límites por usuario.
- **Panel de usuario (Dashboard)** para monitorear reservas activas y gestionar cancelaciones permitidas.
- **Panel de administración** para control de inventario y desactivación segura de espacios.
- **Soporte multi-idioma (i18n)** para Español e Inglés y componentes inmunes a desincronizaciones de hidratación por zona horaria.

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Framework Core** | [Next.js (App Router)](https://nextjs.org/) | `16.4.3` | Enrutamiento de servidor/cliente, Server Components, Route Handlers y Turbopack |
| **Librería UI** | [React](https://react.dev/) | `19.3.0` | Renderizado reactivo, Server Actions y Hooks modernos |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) | `v4.3` | Motor de diseño con `@tailwindcss/postcss` y variables CSS nativas |
| **ORM & Database** | [Prisma ORM](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) | `7.10.1` | Modelado de datos relacional con `@prisma/adapter-pg` y pool `pg` nativo |
| **Autenticación** | [Jose](https://github.com/panva/jose) + [Bcryptjs](https://github.com/dcodeIO/bcrypt.js) | `6.2` / `3.0` | JWT HS256 stateless, cookies HTTP-only y hashing salteado de contraseñas |
| **Validación** | [Zod](https://zod.dev/) | `4.6` | Esquemas de validación de entrada tipados |
| **Tipado** | [TypeScript](https://www.typescriptlang.org/) | `v5.x` | Tipado estático estricto en cliente, servidor y modelos |
| **Contenedores** | [Docker](https://www.docker.com/) | Multi-stage | Empaquetado minimalista con Alpine Linux y usuario no-root |

---

## 🏛 Arquitectura del Sistema

```mermaid
flowchart TD
    Client["Navegador Web / Cliente"]

    subgraph Edge["Middleware & Edge Proxy"]
        MW["src/middleware.ts\n(JWT Guard & Role Redirects)"]
    end

    subgraph AppRouter["Next.js 16 App Router"]
        PublicRoutes["(public) Catálogo & Detalle\n(SSR dinámico vía connection())"]
        PrivateRoutes["(private) Dashboard\n(Client Components con Hydration Safe)"]
        AdminRoutes["(admin) Panel de Gestión"]
        APIRoutes["Route Handlers (src/app/api/*)"]
    end

    subgraph BusinessLogic["Capa de Servicios & Lib"]
        AuthService["Auth & Session Controller\n(src/lib/jwt.ts, server-auth.ts)"]
        ValidationRules["Motor de Reglas de Negocio (1-14)\n(Horarios, Cuotas, Cancelaciones)"]
    end

    subgraph DatabaseLayer["Persistencia"]
        PrismaPg["Prisma ORM 7 + @prisma/adapter-pg\n(pg Pool Connection)"]
        Postgres[(Base de Datos PostgreSQL)]
    end

    Client -->|Petición HTTP| MW
    MW -->|Ruta Permitida| AppRouter
    AppRouter --> APIRoutes
    APIRoutes --> AuthService
    APIRoutes --> ValidationRules
    ValidationRules --> PrismaPg
    AuthService --> PrismaPg
    PrismaPg --> Postgres
```

---

## 📁 Estructura del Proyecto

```text
cospace-nxt/
├── prisma/
│   ├── schema.prisma          # Definición de modelos, relaciones y enums
│   └── seed.ts                # Inicialización de usuarios (Admin/User) y espacios demo
├── public/                    # Archivos estáticos
├── src/
│   ├── app/
│   │   ├── (admin)/           # Grupo de rutas para Administración
│   │   │   └── admin/spaces/  # Gestión y mantenimiento de espacios
│   │   ├── (auth)/            # Grupo de autenticación
│   │   │   ├── login/         # Página de inicio de sesión
│   │   │   └── register/      # Página de registro
│   │   ├── (private)/         # Grupo protegido para usuarios autenticados
│   │   │   └── dashboard/     # Panel de reservas del usuario y cancelación
│   │   ├── (public)/          # Grupo público
│   │   │   ├── spaces/        # Catálogo SSR de espacios
│   │   │   │   └── [id]/      # Vista de detalle de espacio
│   │   │   └── page.tsx       # Landing page principal
│   │   ├── api/               # API RESTful (Route Handlers)
│   │   │   ├── auth/          # login, logout, refresh, register
│   │   │   ├── reservations/  # Crear y consultar reservas
│   │   │   │   └── [id]/cancel# Cancelación de reserva
│   │   │   └── spaces/        # Consultar y crear espacios
│   │   │       └── [id]/cancel# Desactivación segura (soft-delete)
│   │   ├── globals.css        # Importación de Tailwind CSS v4 y tema
│   │   └── layout.tsx         # Layout raíz (I18nProvider, Navbar, Metadatos)
│   ├── components/
│   │   ├── i18n-provider.tsx  # Contexto de internacionalización reactivo (ES/EN)
│   │   ├── local-date.tsx     # Guard de renderizado de fecha para prevenir hydration mismatch
│   │   ├── navbar.tsx         # Barra de navegación interactiva y selector de idioma
│   │   └── shared/            # Componentes reutilizables (Sidebar, Footer, etc.)
│   ├── lib/
│   │   ├── cookies.ts         # Asignación y expiración segura de cookies HTTP-only
│   │   ├── db.ts              # Cliente Singleton de Prisma con pool de PostgreSQL
│   │   ├── jwt.ts             # Creación y verificación de tokens con Jose
│   │   └── server-auth.ts     # Validadores de sesión en handlers de servidor
│   ├── middleware.ts          # Protección perimetral de rutas y control de roles
│   └── services/              # Lógica de abstracción de autenticación y recursos
├── Dockerfile                 # Construcción optimizada multi-etapa para producción
├── next.config.ts             # Configuración del compilador y dominios de imágenes
├── postcss.config.mjs         # Integración de @tailwindcss/postcss
└── package.json               # Dependencias y scripts
```

---

## 🗄 Modelo de Datos (Prisma ORM)

El esquema relacional define 3 modelos centrales y 3 enumeraciones de estado:

```mermaid
erDiagram
    User ||--o{ Reservation : "realiza (1:N)"
    Space ||--o{ Reservation : "aloja (1:N)"

    User {
        String id PK "UUID"
        String email UK "Único"
        String password "Hash Bcrypt"
        String name
        Role role "USER | ADMIN"
        String hashedRefreshToken "Nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    Space {
        String id PK "UUID"
        String name
        SpaceType type "DESK | MEETING_ROOM | BOOTH"
        String description
        Int capacity "Número de personas"
        Decimal pricePerHour "Tarifa por hora"
        String imageUrl "Nullable"
        Boolean isActive "Default true"
        DateTime createdAt
        DateTime updatedAt
    }

    Reservation {
        String id PK "UUID"
        String userId FK
        String spaceId FK
        DateTime startTime "Hora de inicio"
        DateTime endTime "Hora de fin"
        Decimal totalPrice "Calculado por backend"
        ReservationStatus status "CONFIRMED | CANCELLED"
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## ⚖️ Reglas de Negocio Implementadas

El sistema aplica 14 reglas rigurosas en el backend para garantizar integridad de datos y evitar inconsistencias operativas:

| Regla | Código / Nombre | Descripción Técnica |
| :---: | :--- | :--- |
| **1** | **Duración Exacta** | Las reservas deben tener una duración de entre **1 y 4 horas enteras**. Los minutos y segundos deben ser estrictamente `00:00`. |
| **2** | **Ventana Operativa** | El horario de atención permitido es de **07:00 a 21:00 UTC**. No se procesan reservas fuera de esta franja. |
| **3** | **Ventana de Anticipación** | No se permite reservar en fechas pasadas ni con más de **30 días de antelación**. |
| **4** | **No Solapamiento de Espacio** | Un espacio no puede tener dos reservas en estado `CONFIRMED` cuyos rangos de horario se superpongan (`startTime < end && endTime > start`). |
| **5** | **No Solapamiento de Usuario** | Un mismo usuario no puede reservar dos espacios diferentes en el mismo rango de tiempo simultáneo. |
| **6** | **Cuota Máxima por Usuario** | Cada usuario regular puede tener un máximo de **3 reservas futuras activas** (`CONFIRMED`) al mismo tiempo. |
| **7** | **Estado de Espacio Activo** | No se pueden crear reservas en espacios con `isActive: false` o inexistentes. |
| **8** | **Integridad Financiera** | El cálculo de `totalPrice` se ejecuta **exclusivamente en el backend** multiplicando las horas enteras por la tarifa vigente del espacio (`pricePerHour`), protegiendo la transacción de manipulaciones en el cliente. |
| **9** | **Control de Autorización para Cancelar** | Una reserva solo puede ser cancelada por el **usuario que la creó** o por un usuario con rol `ADMIN`. |
| **10** | **Política de Cancelación Anticipada** | Los usuarios regulares deben cancelar con al menos **2 horas de anticipación** respecto a la hora de inicio (`startTime`). Los administradores pueden cancelar en cualquier momento. |
| **11** | **Cancelación Lógica (Soft Cancel)** | Las reservas no se eliminan físicamente de la base de datos; su estado cambia a `CANCELLED` para preservar el historial y la auditoría. |
| **12** | **Ciclo de Vida de Sesión Seguro** | Estrategia de doble token: **Access Token** de 15 minutos y **Refresh Token** de 7 días. El Refresh Token se almacena cifrado con hash en la base de datos para permitir revocación inmediata. |
| **13** | **Desactivación Segura de Espacio** | Un administrador no puede desactivar un espacio (`isActive = false`) si existen reservas futuras confirmadas asociadas a él (retorna error `409 Conflict`). |
| **14** | **Aislamiento Estricto de Consultas** | Las consultas de reservas de usuario forzosamente filtran por el identificador del token extraído de la cookie de sesión, descartando cualquier parámetro malicioso inyectado vía query params. |

---

## 🔐 Autenticación y Seguridad

El sistema implementa seguridad perimetral multicapa:

1. **Tokens en Cookies `httpOnly`**:
   - `accessToken`: Vida útil de 15 minutos (`maxAge: 900`). Protegido contra accesos por scripts maliciosos (XSS).
   - `refreshToken`: Vida útil de 7 días (`maxAge: 604800`).
   - Flags: `httpOnly: true`, `sameSite: "lax"`, y `secure: true` en entornos de producción.
2. **Middleware de Protección Perimetral**:
   - Intercepta `/dashboard/:path*` y `/admin/:path*`.
   - Verifica la firma criptográfica del JWT mediante `jose`.
   - Redirige usuarios sin privilegios (un `USER` intentando ingresar a `/admin` es redirigido a `/dashboard`).
3. **Manejo de Hydration Mismatch**:
   - El componente `LocalDate` utiliza un ciclo de montaje seguro para formatear fechas en el huso horario del cliente sin discrepancias de SSR.

---

## 📡 Referencia de la API REST

### Autenticación (`/api/auth`)

| Endpoint | Método | Acceso | Descripción |
| :--- | :---: | :--- | :--- |
| `/api/auth/register` | `POST` | Público | Registra un nuevo usuario con rol predeterminado `USER`. |
| `/api/auth/login` | `POST` | Público | Valida credenciales, genera tokens, asigna cookies y guarda el hash del refresh token. |
| `/api/auth/refresh` | `POST` | Autenticado | Compara el refresh token contra la BD y emite un nuevo `accessToken`. |
| `/api/auth/logout` | `POST` | Autenticado | Elimina las cookies de autenticación del navegador. |

### Espacios (`/api/spaces`)

| Endpoint | Método | Acceso | Descripción |
| :--- | :---: | :--- | :--- |
| `/api/spaces` | `GET` | Público / Auth | Lista espacios activos (los administradores ven también los inactivos). |
| `/api/spaces` | `POST` | Solo `ADMIN` | Registra un nuevo espacio en el sistema. |
| `/api/spaces/[id]/cancel`| `PATCH`| Solo `ADMIN` | Desactiva un espacio verificando que no existan reservas futuras (Regla 13). |

### Reservas (`/api/reservations`)

| Endpoint | Método | Acceso | Descripción |
| :--- | :---: | :--- | :--- |
| `/api/reservations` | `GET` | Autenticado | Retorna las reservas del usuario autenticado (Regla 14). |
| `/api/reservations` | `POST` | Autenticado | Valida y crea una nueva reserva ejecutando las Reglas 1 a 8. |
| `/api/reservations/[id]/cancel` | `PATCH` | Dueño / `ADMIN` | Cancela una reserva existente según las Reglas 9, 10 y 11. |

---

## 💻 Puesta en Marcha (Desarrollo)

### Prerrequisitos

- **Node.js**: v20 o superior
- **npm**: v10 o superior
- **PostgreSQL**: Instancia local o remota (Neon, Supabase, etc.)

### 1. Clonar e Instalar Dependencias

```bash
git clone <url-del-repositorio>
cd cospace-nxt
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente plantilla:

```env
# Conexión en modo pooler para la aplicación
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/cospace_db?schema=public"

# Conexión directa para migraciones y seeds
DIRECT_URL="postgresql://usuario:contraseña@localhost:5432/cospace_db?schema=public"

# Clave secreta para firma de JSON Web Tokens
JWT_SECRET="super-secret-key-cospace-2026"

# Entorno
NODE_ENV="development"
```

### 3. Sincronizar Base de Datos y Sembrar Datos Iniciales

```bash
# Empujar el esquema de Prisma hacia PostgreSQL
npm run db:push

# Ejecutar el seed (crea usuarios y espacios de ejemplo)
npm run db:seed
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará accesible en: [http://localhost:3000](http://localhost:3000)

---

## 👥 Usuarios y Credenciales de Prueba

Al ejecutar `npm run db:seed`, se generan automáticamente las siguientes cuentas:

| Rol | Correo Electrónico | Contraseña | Destino al Iniciar Sesión |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@cospace.com` | `Admin123*` | `/admin/spaces` |
| **Usuario Regular** | `usuario@cospace.com` | `User123*` | `/dashboard` |

---

## 🐳 Despliegue y Contenedores (Docker)

El proyecto incluye un `Dockerfile` optimizado en **3 etapas** (`deps`, `builder`, `runner`) sobre `node:20-alpine`, garantizando:
- Tamaño de imagen reducido.
- Ejecución con usuario no privilegiado (`nextjs:nodejs` con UID/GID 1001).
- Generación de cliente Prisma nativo para arquitectura Linux.

### Construir Imagen Docker

```bash
docker build -t cospace-nxt:latest .
```

### Ejecutar Contenedor

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="tu_cadena_de_conexion" \
  -e DIRECT_URL="tu_cadena_de_conexion" \
  -e JWT_SECRET="tu_jwt_secret" \
  cospace-nxt:latest
```

### Ejecutar Contenedor

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="tu_cadena_de_conexion" \
  -e DIRECT_URL="tu_cadena_de_conexion" \
  -e JWT_SECRET="tu_jwt_secret" \
  cospace-nxt:latest
```

