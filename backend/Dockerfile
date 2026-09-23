# ---------- Base ----------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json prisma.config.ts openapi.yaml ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# ---------- Production ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/openapi.yaml ./openapi.yaml

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
