import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { FeishuSyncService } from "../../../modules/feishu-sync/application/feishu-sync.service";
import { registerTask } from "../../task-registry";

@Injectable()
export class BaseDataTasks implements OnModuleInit {
  private readonly logger = new Logger(BaseDataTasks.name);

  constructor(private readonly feishuSyncService: FeishuSyncService) {}

  onModuleInit() {
    registerTask("base-data", "feishu-sync", () => this.feishuSync());
    this.logger.log("Registered task handler: base-data:feishu-sync");
  }

  async feishuSync() {
    this.logger.log("Executing feishu-sync task");
    await this.feishuSyncService.execute();
  }
}
