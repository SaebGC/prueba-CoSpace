# -------------------------------------------------------------
# Etapa 1: Dependencias (deps)
# -------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar manifiestos de dependencias y esquema de base de datos
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar dependencias exactas y generar cliente Prisma
RUN npm ci

# -------------------------------------------------------------
# Etapa 2: Compilación (builder)
# -------------------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente de Prisma para el entorno Linux
RUN npx prisma generate

# Desactivar telemetría durante el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compilación de la aplicación
RUN npm run build

# -------------------------------------------------------------
# Etapa 3: Ejecución de Producción (runner)
# -------------------------------------------------------------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos estáticos y bundle standalone optimizado
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]