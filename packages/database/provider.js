"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseProvider = exports.DATABASE_CLIENT = void 0;
const client_1 = require("./src/generated/index.js");

exports.DATABASE_CLIENT = "DATABASE_CLIENT";
exports.DatabaseProvider = {
  provide: exports.DATABASE_CLIENT,
  useFactory: () => new client_1.PrismaClient(),
  isGlobal: true,
};
