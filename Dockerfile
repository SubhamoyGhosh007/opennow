# ---- deps (cached unless package.json changes) ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy build-time secrets so `next build` can evaluate server modules.
# Real values come from Dokploy environment at RUNTIME and override these.
ENV AUTH_SECRET=build-time-placeholder-secret-000000000000 \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    NEXTAUTH_URL=http://localhost:3000 \
    REDIS_HOST=localhost \
    REDIS_PORT=6379
RUN npm run build

# ---- production runner (standalone output) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
