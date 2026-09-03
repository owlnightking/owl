import { Module } from "@nestjs/common";
import { TaskQueuePublisher } from "./task-queue.publisher";
import { TaskQueueConsumer } from "./task-queue.consumer";
import { TaskQueueService } from "./task-queue.service";
import { TaskQueueScheduler } from "./task-queue.scheduler";
import { TaskQueueController } from "./task-queue.controller";
import { BaseDataController } from "./areas/base-data/base-data.controller";
import { BaseDataTasks } from "./areas/base-data/base-data.tasks";
import { FeishuSyncModule } from "../modules/feishu-sync/feishu-sync.module";

@Module({
  imports: [FeishuSyncModule],
  controllers: [TaskQueueController, BaseDataController],
  providers: [TaskQueuePublisher, TaskQueueConsumer, TaskQueueService, TaskQueueScheduler, BaseDataTasks],
  exports: [TaskQueueService],
})
export class TaskQueueModule {}
