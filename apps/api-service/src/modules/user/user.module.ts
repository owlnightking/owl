import { Module } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import { UserUseCase, USER_SERVICE } from "./application/user.use-case";
import { UserController } from "./presentation/user.controller";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { USER_REPOSITORY } from "./domain/user.ports";
import { RoleModule } from "../role/role.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [RoleModule, AuthModule],
  controllers: [UserController],
  providers: [
    PrismaClient,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: USER_SERVICE, useClass: UserUseCase },
  ],
  exports: [USER_SERVICE, USER_REPOSITORY],
})
export class UserModule {}
