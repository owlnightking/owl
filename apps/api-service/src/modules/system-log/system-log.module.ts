import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SYSTEM_LOG_RECORDER } from "../../common/observability/system-log.ports";
import { SYSTEM_LOG_REPOSITORY, SYSTEM_LOG_SERVICE } from "./domain/system-log.ports";
import { PrismaSystemLogRepository } from "./infrastructure/prisma-system-log.repository";
import { SystemLogService } from "./application/system-log.service";
import { SystemLogController } from "./presentation/system-log.controller";

@Module({
  imports: [AuthModule],
  controllers: [SystemLogController],
  providers: [
    { provide: SYSTEM_LOG_REPOSITORY, useClass: PrismaSystemLogRepository },
    { provide: SYSTEM_LOG_SERVICE, useClass: SystemLogService },
    { provide: SYSTEM_LOG_RECORDER, useExisting: SYSTEM_LOG_SERVICE },
  ],
  exports: [SYSTEM_LOG_RECORDER, SYSTEM_LOG_SERVICE],
})
export class SystemLogModule {}
