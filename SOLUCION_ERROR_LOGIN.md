# 🛠️ Documento Técnico: Resolución del Error "Error en el servidor" al Iniciar Sesión

> **Proyecto:** CoSpace (cospace-nxt)  
> **Módulo:** Autenticación y Sesiones (`/api/auth/login`, `src/lib/cookies.ts`, `src/lib/jwt.ts`, `src/lib/db.ts`)  
> **Fecha:** Octubre 2026  

---

## 📌 1. El Problema Original

Al intentar iniciar sesión en la página `/login` ingresando credenciales (incluso credenciales correctas como `admin@cospace.com`), la interfaz mostraba una alerta en color rojo con el texto:

> **"Error en el servidor"**

### ¿De dónde salía ese mensaje?
En el manejador del backend ([src/app/api/auth/login/route.ts](file:///c:/Users/garci/cospace-nxt/src/app/api/auth/login/route.ts)), el código tiene la siguiente estructura:

```typescript
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // ... generación de tokens y actualización en base de datos ...

    return NextResponse.json({ message: "Login exitoso", role: user.role });
  } catch (error) {
    // 💥 CUALQUIER EXCEPCIÓN NO CONTROLADA CAÍA AQUÍ:
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
```

Si las credenciales fueran incorrectas, el servidor respondía con **código `401`** y el mensaje `"Credenciales inválidas"`.  
Sin embargo, el servidor estaba respondiendo con **código `500`**, lo que demostraba que una **excepción inesperada** rompía el flujo dentro del bloque `try`.

---

## 🔍 2. Las Causas Raíz Identificadas

A través del análisis del flujo de ejecución, se descubrieron **4 causas técnicas** que provocaban que el código se fuera al `catch`:

```mermaid
flowchart TD
    Req["Cliente envía POST /api/auth/login"] --> Step1["1. db.user.findUnique(email)"]
    Step1 -->|Fallo: Sin Driver Adapter / Pooler| Err["Lanza Excepción"]
    Step1 --> Step2["2. Comparación Bcrypt"]
    Step2 --> Step3["3. Generación JWT (jose)"]
    Step3 --> Step4["4. db.user.update(hashedRefreshToken)"]
    Step4 -->|Fallo: Columna o BD sin sincronizar| Err
    Step4 --> Step5["5. setAuthCookies(accessToken, refreshToken)"]
    Step5 -->|Fallo: cookies() sin await en Next.js 16| Err
    Err --> CatchBlock["catch (error) -> HTTP 500 'Error en el servidor'"]
    Step5 -->|Éxito| Success["HTTP 200 'Login exitoso'"]
```

---

### Causa 1: `cookies()` asincrónico en Next.js 15 y 16 (Breaking Change)
* **El Problema:**  
  En Next.js 13 y 14, la función `cookies()` de `next/headers` era síncrona:  
  `const cookieStore = cookies();`  
  En **Next.js 15 y 16**, `cookies()` es **asíncrona** y devuelve una `Promise<ReadonlyRequestCookies>`.  
  Si no se le colocaba `await`, `cookieStore` era una promesa pendiente, y al ejecutar:
  ```typescript
  cookieStore.set("accessToken", accessToken, { ... });
  ```
  JavaScript arrojaba la excepción en tiempo de ejecución:  
  `TypeError: cookieStore.set is not a function`.
* **Impacto:** Esta falla interrumpía la petición justo después de validar al usuario y caía directamente en el `catch` devolviendo el error 500.

---

### Causa 2: Desincronización del esquema y el campo `hashedRefreshToken` en PostgreSQL
* **El Problema:**  
  El sistema de CoSpace implementa la **Regla 12 de seguridad**: no guarda sesiones en texto plano; toma el `refreshToken`, lo hashea con Bcrypt y lo persiste en PostgreSQL:
  ```typescript
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await db.user.update({
    where: { id: user.id },
    data: { hashedRefreshToken },
  });
  ```
  Si la base de datos en Supabase no tenía aplicada la columna `hashed_refresh_token` (o el mapeo en `@map("hashed_refresh_token")`), la consulta SQL de Prisma fallaba con un error de base de datos (`column "hashed_refresh_token" does not exist`).
* **Impacto:** La actualización fallaba y disparaba la excepción del `catch`.

---

### Causa 3: Configuración de Conexión a Base de Datos en Prisma 7 (`@prisma/adapter-pg`)
* **El Problema:**  
  Prisma 7 desacopló el motor tradicional de Rust y exige el uso de **Driver Adapters** (`@prisma/adapter-pg` y el pool nativo `pg`) para comunicarse con PostgreSQL en entornos Serverless. Si el cliente de Prisma se instanciaba sin el adaptador correcto o con parámetros no compatibles con PgBouncer (puerto 6543 en Supabase), las consultas arrojaban *Connection Terminated* o *Prepared Statement Error*.
* **Impacto:** Ni siquiera se podía consultar `db.user.findUnique`, fallando desde el primer paso del login.

---

### Causa 4: Incompatibilidad de firmas de JWT en `auth.service.ts`
* **El Problema:**  
  El servicio de autenticación importaba una función `signJWT` que no existía en `@/lib/jwt` (la librería real utilizaba `createAccessToken` y `createRefreshToken` con la librería moderna `jose`). Aunque era un error de tipado/compilación, impedía la correcta resolución modular durante el empaquetado.

---

## 🛠️ 3. Las Soluciones Aplicadas

### Paso 1: Corrección de Asincronía en las Cookies ([src/lib/cookies.ts](file:///c:/Users/garci/cospace-nxt/src/lib/cookies.ts))
Se aseguró que la función espere (`await`) la resolución del almacén de cookies de Next.js antes de asignar los tokens con banderas seguras:

```typescript
import { cookies } from "next/headers";

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  // ✅ OBLIGATORIO en Next.js 16: await cookies()
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutos
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  });
}
```

---

### Paso 2: Conexión Robusta con Pool Nativo de PostgreSQL ([src/lib/db.ts](file:///c:/Users/garci/cospace-nxt/src/lib/db.ts))
Se configuró el singleton de Prisma utilizando el driver nativo de `pg` y el adaptador oficial de Prisma 7:

```typescript
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

---

### Paso 3: Sincronización del Esquema y Sembrado de Datos
Se sincronizó la base de datos de PostgreSQL para asegurar que las tablas y columnas existan exactamente como las define el modelo:

```bash
# 1. Empujar cambios de esquema a PostgreSQL
npm run db:push

# 2. Sembrar usuarios iniciales con contraseñas hasheadas en Bcrypt
npm run db:seed
```

Esto garantizó que:
1. La tabla `users` cuenta con la columna `hashed_refresh_token` (`TEXT` anulable).
2. El usuario administrador (`admin@cospace.com` / `Admin123*`) existe con una contraseña válida cifrada con 10 rondas de salteo.

---

### Paso 4: Unificación de Servicios JWT ([src/lib/jwt.ts](file:///c:/Users/garci/cospace-nxt/src/lib/jwt.ts))
Se utilizó la librería estándar `jose` con codificación segura de la clave secreta `JWT_SECRET`:

```typescript
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-cospace-2026"
);

export async function createAccessToken(payload: { id: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: { id: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}
```

---

## 🎯 4. Cómo Sustentar esta Solución (Preguntas Clave)

### Pregunta: ¿Por qué antes salía "Error en el servidor" y no "Credenciales inválidas"?
> **Respuesta:**  
> "Porque el error no era de validación de usuario, sino una excepción en tiempo de ejecución (*runtime exception*) dentro del backend. Ocurría principalmente porque en Next.js 16 la API de `cookies()` pasó a ser asíncrona; al no esperar la promesa (`await cookies()`), el método `.set()` fallaba lanzando un TypeError que caía en el bloque `catch (error)`, respondiendo con código HTTP 500. Una vez que agregamos el `await`, sincronizamos la columna `hashedRefreshToken` en PostgreSQL y configuramos el adapter nativo de Prisma, el flujo se completó al 100% devolviendo HTTP 200."

### Pregunta: ¿Por qué es necesario guardar el hash del Refresh Token en la base de datos?
> **Respuesta:**  
> "Por la Regla 12 de seguridad. Si guardáramos el refresh token en texto plano y la base de datos sufriera una fuga, cualquier atacante podría usurpar sesiones. Al guardarlo con `bcrypt.hash(refreshToken, 10)`, protegemos el token y además permitimos la **revocación inmediata**: cuando el usuario cierra sesión, eliminamos el hash de la BD y ese token queda invalidado de forma permanente."

---

## ✅ 5. Resultado Final

Tras aplicar estas correcciones:
1. El inicio de sesión con `admin@cospace.com` y `Admin123*` responde **`HTTP 200 OK`**.
2. Las cookies `accessToken` (15 min) y `refreshToken` (7 días) se inyectan en el navegador con banderas `httpOnly`, `sameSite: lax` y `secure`.
3. El frontend redirige fluidamente según el rol:
   * **ADMIN** $\rightarrow$ `/admin/spaces`
   * **USER** $\rightarrow$ `/dashboard`
4. Si las credenciales son incorrectas, ahora sí muestra limpiamente **`HTTP 401: Credenciales inválidas`** en lugar del error 500.
