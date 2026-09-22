import { Module } from "@nestjs/common";
import { SchedulerController } from "./presentation/scheduler.controller";
import { SchedulerService } from "./application/scheduler.service";
import { PrismaSchedulerConfigRepository } from "./infrastructure/prisma-scheduler-config.repository";
import { PrismaSchedulerRunRepository } from "./infrastructure/prisma-scheduler-run.repository";
import { SCHEDULER_CONFIG_REPOSITORY, SCHEDULER_RUN_REPOSITORY, SCHEDULER_SERVICE } from "./domain/scheduler.ports";

@Module({
  controllers: [SchedulerController],
  providers: [
    { provide: SCHEDULER_CONFIG_REPOSITORY, useClass: PrismaSchedulerConfigRepository },
    { provide: SCHEDULER_RUN_REPOSITORY, useClass: PrismaSchedulerRunRepository },
    { provide: SCHEDULER_SERVICE, useClass: SchedulerService },
  ],
  exports: [SCHEDULER_CONFIG_REPOSITORY, SCHEDULER_RUN_REPOSITORY, SCHEDULER_SERVICE],
})
export class SchedulerModule {}
