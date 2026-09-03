import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { resolve } from "node:path";
import { PrismaModule } from "./prisma.module";
import { HealthController } from "./health.controller";
import { TaskQueueModule } from "./task-queue/task-queue.module";
import { SchedulerModule } from "./modules/scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(__dirname, "../../../.env"), ".env"],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TaskQueueModule,
    SchedulerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
