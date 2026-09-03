import { Module } from "@nestjs/common";
import { FeishuSyncUseCase } from "./application/feishu-sync.use-case";
import { FeishuSyncClient } from "./infrastructure/feishu-sync.client";
import { PrismaDepartmentRepository } from "./infrastructure/prisma-department.repository";
import { PrismaUserSyncRepository } from "./infrastructure/prisma-user-sync.repository";
import { PrismaSyncLogRepository } from "./infrastructure/prisma-sync-log.repository";
import {
  FEISHU_SYNC_PORT,
  DEPARTMENT_REPOSITORY,
  USER_SYNC_REPOSITORY,
  SYNC_LOG_REPOSITORY,
} from "./domain/feishu-sync.ports";

@Module({
  providers: [
    FeishuSyncUseCase,
    { provide: FEISHU_SYNC_PORT, useClass: FeishuSyncClient },
    { provide: DEPARTMENT_REPOSITORY, useClass: PrismaDepartmentRepository },
    { provide: USER_SYNC_REPOSITORY, useClass: PrismaUserSyncRepository },
    { provide: SYNC_LOG_REPOSITORY, useClass: PrismaSyncLogRepository },
  ],
  exports: [FeishuSyncUseCase],
})
export class FeishuSyncModule {}
