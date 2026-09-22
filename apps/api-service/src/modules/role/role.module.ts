import { Module } from "@nestjs/common";
import { RoleService } from "./application/role.service";
import { RoleController } from "./presentation/role.controller";
import { PrismaRoleRepository } from "./infrastructure/prisma-role.repository";
import { ROLE_REPOSITORY, ROLE_SERVICE } from "./domain/role.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [RoleController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: ROLE_SERVICE, useClass: RoleService },
  ],
  exports: [ROLE_SERVICE, ROLE_REPOSITORY],
})
export class RoleModule {}
