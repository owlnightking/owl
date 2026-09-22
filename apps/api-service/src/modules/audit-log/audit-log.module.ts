import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuditLogInterceptor } from "./application/audit-log.interceptor";
import { AuditLogService } from "./application/audit-log.service";
import { PrismaAuditLogger } from "./infrastructure/prisma-audit-logger";
import { PrismaAuditLogRepository } from "./infrastructure/prisma-audit-log.repository";
import { IpRegionService } from "./infrastructure/ip-region.service";
import { AUDIT_LOGGER, AUDIT_LOG_REPOSITORY, AUDIT_LOG_SERVICE, IP_REGION } from "./domain/audit-log.ports";
import { AuditLogController } from "./presentation/audit-log.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AuditLogController],
  providers: [
    { provide: AUDIT_LOGGER, useClass: PrismaAuditLogger },
    { provide: IP_REGION, useClass: IpRegionService },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: AUDIT_LOG_SERVICE, useClass: AuditLogService },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
  exports: [AUDIT_LOGGER],
})
export class AuditLogModule {}
