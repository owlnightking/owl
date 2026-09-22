import { Module } from "@nestjs/common";
import { PermissionService } from "./application/permission.service";
import { PermissionController } from "./presentation/permission.controller";
import { PrismaPermissionRepository } from "./infrastructure/prisma-permission.repository";
import { PERMISSION_REPOSITORY, PERMISSION_SERVICE } from "./domain/permission.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PermissionController],
  providers: [
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    { provide: PERMISSION_SERVICE, useClass: PermissionService },
  ],
  exports: [PERMISSION_SERVICE],
})
export class PermissionModule {}
