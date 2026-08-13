import { Module } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import { RoleUseCase } from "./application/role.use-case";
import { RoleController } from "./presentation/role.controller";
import { PrismaRoleRepository } from "./infrastructure/prisma-role.repository";
import { ROLE_REPOSITORY, ROLE_SERVICE } from "./domain/role.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [RoleController],
  providers: [
    PrismaClient,
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: ROLE_SERVICE, useClass: RoleUseCase },
  ],
  exports: [ROLE_SERVICE, ROLE_REPOSITORY],
})
export class RoleModule {}
