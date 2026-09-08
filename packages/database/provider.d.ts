import { PrismaClient } from "./src/generated/index.js";
export declare const DATABASE_CLIENT = "DATABASE_CLIENT";
export declare const DatabaseProvider: {
  provide: string;
  useFactory: () => PrismaClient;
  isGlobal: boolean;
};
