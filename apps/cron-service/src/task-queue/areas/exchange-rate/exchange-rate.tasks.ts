import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ExchangeRateSyncService } from "../../../modules/exchange-rate-sync/application/exchange-rate-sync.service";
import { registerTask } from "../../task-registry";

@Injectable()
export class ExchangeRateTasks implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRateTasks.name);

  constructor(private readonly syncService: ExchangeRateSyncService) {}

  onModuleInit() {
    registerTask("exchange-rate", "sync", () => this.sync());
    this.logger.log("Registered task handler: exchange-rate:sync");
  }

  async sync() {
    this.logger.log("Executing exchange-rate:sync task");
    await this.syncService.execute();
  }
}
