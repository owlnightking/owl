import { Module } from "@nestjs/common";
import { SchedulerController } from "./presentation/scheduler.controller";
import { PrismaSchedulerConfigRepository } from "./infrastructure/prisma-scheduler-config.repository";
import { PrismaSchedulerRunRepository } from "./infrastructure/prisma-scheduler-run.repository";
import { SCHEDULER_CONFIG_REPOSITORY, SCHEDULER_RUN_REPOSITORY } from "./domain/scheduler.ports";

@Module({
  controllers: [SchedulerController],
  providers: [
    { provide: SCHEDULER_CONFIG_REPOSITORY, useClass: PrismaSchedulerConfigRepository },
    { provide: SCHEDULER_RUN_REPOSITORY, useClass: PrismaSchedulerRunRepository },
  ],
  exports: [SCHEDULER_CONFIG_REPOSITORY, SCHEDULER_RUN_REPOSITORY],
})
export class SchedulerModule {}
