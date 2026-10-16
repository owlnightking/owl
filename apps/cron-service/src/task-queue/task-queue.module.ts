import { Module } from "@nestjs/common";
import { TaskQueuePublisher } from "./task-queue.publisher";
import { TaskQueueConsumer } from "./task-queue.consumer";
import { TaskQueueService } from "./task-queue.service";
import { TaskQueueScheduler } from "./task-queue.scheduler";
import { TaskQueueController } from "./task-queue.controller";
import { BaseDataController } from "./areas/base-data/base-data.controller";
import { BaseDataTasks } from "./areas/base-data/base-data.tasks";
import { ExchangeRateController } from "./areas/exchange-rate/exchange-rate.controller";
import { ExchangeRateTasks } from "./areas/exchange-rate/exchange-rate.tasks";
import { FeishuSyncModule } from "../modules/feishu-sync/feishu-sync.module";
import { ExchangeRateSyncModule } from "../modules/exchange-rate-sync/exchange-rate-sync.module";

@Module({
  imports: [FeishuSyncModule, ExchangeRateSyncModule],
  controllers: [TaskQueueController, BaseDataController, ExchangeRateController],
  providers: [
    TaskQueuePublisher,
    TaskQueueConsumer,
    TaskQueueService,
    TaskQueueScheduler,
    BaseDataTasks,
    ExchangeRateTasks,
  ],
  exports: [TaskQueueService],
})
export class TaskQueueModule {}
