import { Module } from "@nestjs/common";
import { PermissionUseCase } from "./application/permission.use-case";
import { PermissionController } from "./presentation/permission.controller";
import { PrismaPermissionRepository } from "./infrastructure/prisma-permission.repository";
import { PERMISSION_REPOSITORY, PERMISSION_SERVICE } from "./domain/permission.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PermissionController],
  providers: [
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    { provide: PERMISSION_SERVICE, useClass: PermissionUseCase },
  ],
  exports: [PERMISSION_SERVICE],
})
export class PermissionModule {}
