import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaClient } from "@owl/database";
import { AuthUseCase } from "./application/auth.use-case";
import { AuthController } from "./presentation/auth.controller";
import { FeishuAuthClient } from "./infrastructure/feishu-auth.client";
import { JwtTokenService } from "./infrastructure/jwt-token.service";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { RedisSessionStore } from "./infrastructure/redis-session.store";
import { JwtAuthGuard } from "./application/jwt-auth.guard";
import { PermissionGuard } from "./application/permission.guard";
import { RedisOAuthStateStore } from "./infrastructure/redis-oauth-state.store";
import {
  AUTH_PORT,
  AUTH_SERVICE,
  OAUTH_STATE_STORE_PORT,
  SESSION_STORE_PORT,
  TOKEN_PORT,
  USER_REPOSITORY_PORT,
} from "./domain/auth.ports";

const databaseProvider = {
  provide: PrismaClient,
  useFactory: () => new PrismaClient(),
};

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    databaseProvider,
    JwtTokenService,
    { provide: AUTH_PORT, useClass: FeishuAuthClient },
    { provide: SESSION_STORE_PORT, useClass: RedisSessionStore },
    { provide: OAUTH_STATE_STORE_PORT, useClass: RedisOAuthStateStore },
    { provide: TOKEN_PORT, useClass: JwtTokenService },
    { provide: USER_REPOSITORY_PORT, useClass: PrismaUserRepository },
    { provide: AUTH_SERVICE, useClass: AuthUseCase },
    JwtAuthGuard,
    PermissionGuard,
  ],
  exports: [
    PrismaClient,
    TOKEN_PORT,
    AUTH_SERVICE,
    SESSION_STORE_PORT,
    USER_REPOSITORY_PORT,
    JwtAuthGuard,
    PermissionGuard,
  ],
})
export class AuthModule {}
