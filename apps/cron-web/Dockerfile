FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/cron-web/package.json apps/cron-web/package.json
RUN pnpm install --frozen-lockfile --filter @owl/cron-web...
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/cron-web build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html/cron
COPY --from=build /app/apps/cron-web/dist .
COPY apps/cron-web/nginx.conf /etc/nginx/conf.d/default.conf
