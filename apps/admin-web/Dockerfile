FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10.12.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN pnpm install --frozen-lockfile --filter @owl/admin-web...
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/admin-web build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html/admin
COPY --from=build /app/apps/admin-web/dist .
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
