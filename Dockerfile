# Baton: one long-lived Node process (Next.js server + the escalation/projection worker started in
# src/instrumentation.ts). It needs a Postgres DATABASE_URL and the env vars listed in .env.example.
# Secrets are injected by the host at runtime; nothing secret is baked into the image.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build /app/next.config.ts ./
USER node
EXPOSE 3000
# Migrations are idempotent; apply them before the server starts accepting traffic.
CMD ["sh", "-c", "node scripts/migrate.mjs && npx next start -H 0.0.0.0 -p ${PORT}"]
