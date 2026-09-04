FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.12.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma packages/database/prisma
COPY apps/api-service/package.json apps/api-service/package.json
RUN pnpm install --frozen-lockfile --filter @owl/api-service... \
  && pnpm --filter @owl/database exec prisma generate

FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10.12.4 && apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api-service ./apps/api-service
COPY . .
RUN pnpm --filter @owl/shared build
RUN pnpm --filter @owl/api-service typecheck
RUN pnpm --filter @owl/api-service build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN npm install -g pnpm@10.12.4 && apk add --no-cache openssl wget
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api-service ./apps/api-service
EXPOSE 3000
CMD ["node", "apps/api-service/dist/main.js"]