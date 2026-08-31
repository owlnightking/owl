FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10.12.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/owl-web/package.json apps/owl-web/package.json
RUN pnpm install --frozen-lockfile --filter @owl/owl-web...
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/owl-web build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html/owl
COPY --from=build /app/apps/owl-web/dist .
COPY apps/owl-web/nginx.conf /etc/nginx/conf.d/default.conf
