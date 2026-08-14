FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN pnpm install --frozen-lockfile --filter @owl/admin-web...
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/admin-web build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/apps/admin-web/dist .
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
