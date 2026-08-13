FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/database/package.json packages/database/package.json
COPY apps/cron-svc/package.json apps/cron-svc/package.json
RUN pnpm install --frozen-lockfile --filter @owl/cron-service...
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/cron-service build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable && apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/cron-svc ./apps/cron-svc
CMD ["node", "apps/cron-svc/dist/main.js"]