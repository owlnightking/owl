import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { resolve } from "node:path";
import { PrismaModule } from "./prisma.module";
import { HealthController } from "./health.controller";
import { ApiExceptionFilter } from "./common/response/api-exception.filter";
import { PrismaSystemLogRecorder } from "./common/observability/prisma-system-log.recorder";
import { SYSTEM_LOG_RECORDER } from "./common/observability/system-log.ports";
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
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: SYSTEM_LOG_RECORDER, useClass: PrismaSystemLogRecorder },
  ],
})
export class AppModule {}
