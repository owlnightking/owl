FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/permission/package.json packages/permission/package.json
COPY apps/portal/package.json apps/portal/package.json
RUN pnpm install --frozen-lockfile --filter @owl/portal...
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/permission build
RUN pnpm --filter @owl/portal build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/apps/portal/dist .
COPY apps/portal/nginx.conf /etc/nginx/conf.d/default.conf
