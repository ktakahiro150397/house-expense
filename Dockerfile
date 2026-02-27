FROM node:20-alpine AS base

# --- deps: install all dependencies (for build) ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- deps-prod: install production dependencies only (for runner) ---
FROM base AS deps-prod
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- builder: build the Next.js app ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy npx prisma generate
RUN DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy \
    AUTH_URL=http://localhost:3000 \
    AUTH_SECRET=build-time-secret \
    GOOGLE_CLIENT_ID=dummy-client-id.apps.googleusercontent.com \
    GOOGLE_CLIENT_SECRET=dummy-secret \
    npm run build

# --- runner: minimal production image ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrate deploy and seed
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Ensure the uploads directory is writable by the nextjs user
RUN mkdir -p /app/public/uploads/receipts && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/docker-entrypoint.sh"]
