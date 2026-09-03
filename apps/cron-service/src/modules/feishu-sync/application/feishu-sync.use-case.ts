import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  FEISHU_SYNC_PORT,
  DEPARTMENT_REPOSITORY,
  USER_SYNC_REPOSITORY,
  SYNC_LOG_REPOSITORY,
  type FeishuSyncPort,
  type DepartmentRepositoryPort,
  type UserSyncRepositoryPort,
  type SyncLogRepositoryPort,
} from "../domain/feishu-sync.ports";

@Injectable()
export class FeishuSyncUseCase {
  private readonly logger = new Logger(FeishuSyncUseCase.name);

  constructor(
    @Inject(FEISHU_SYNC_PORT) private readonly feishuClient: FeishuSyncPort,
    @Inject(DEPARTMENT_REPOSITORY) private readonly deptRepo: DepartmentRepositoryPort,
    @Inject(USER_SYNC_REPOSITORY) private readonly userRepo: UserSyncRepositoryPort,
    @Inject(SYNC_LOG_REPOSITORY) private readonly syncLogRepo: SyncLogRepositoryPort
  ) {}

  async execute(): Promise<void> {
    const logId = await this.syncLogRepo.create("feishu-sync");
    let total = 0;

    try {
      this.logger.log("Starting Feishu sync...");

      const departments = await this.feishuClient.getDepartmentTree();
      await this.deptRepo.replaceAll(departments);
      this.logger.log(`Synced ${departments.length} departments`);

      const departmentIds = departments.map((d) => d.openDepartmentId);
      const users = await this.feishuClient.getAllUsers(departmentIds);
      await this.userRepo.upsertBatch(users);
      total = users.length;
      this.logger.log(`Synced ${users.length} users`);

      await this.syncLogRepo.update(logId, {
        status: "success",
        total,
        created: total,
      });

      this.logger.log("Feishu sync completed successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Feishu sync failed: ${errorMsg}`);
      await this.syncLogRepo.update(logId, {
        status: "failed",
        total,
        created: 0,
        errorMsg,
      });
      throw error;
    }
  }
}
