import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaClient } from "@owl/database";
import { AuditLogInterceptor } from "./application/audit-log.interceptor";
import { PrismaAuditLogger } from "./infrastructure/prisma-audit-logger";
import { AUDIT_LOGGER } from "./domain/audit-log.ports";
import { AuditLogController } from "./presentation/audit-log.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AuditLogController],
  providers: [
    PrismaClient,
    { provide: AUDIT_LOGGER, useClass: PrismaAuditLogger },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
  exports: [AUDIT_LOGGER],
})
export class AuditLogModule {}
