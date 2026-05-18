FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ENV DATABASE_URL="mysql://placeholder:placeholder@placeholder:3306/placeholder"
RUN npx --workspace apps/api prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist
WORKDIR /app/apps/api
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3000
# db:setup jest idempotentne (prisma db push), więc bezpiecznie odpalamy
# je przy każdym starcie kontenera.
CMD sh -c "npx prisma db push --accept-data-loss && node dist/server.js"
