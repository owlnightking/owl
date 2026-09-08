import { PrismaClient } from "./src/generated/index.js";

/** 全局 PrismaClient InjectionToken — 所有模块通过此 token 注入，禁止各自 new PrismaClient() */
export const DATABASE_CLIENT = "DATABASE_CLIENT";

/** NestJS global provider：注册后全仓可通过 @Inject(DATABASE_CLIENT) 获取同一 PrismaClient 实例 */
export const DatabaseProvider = {
  provide: DATABASE_CLIENT,
  useFactory: () => new PrismaClient(),
  isGlobal: true,
};
