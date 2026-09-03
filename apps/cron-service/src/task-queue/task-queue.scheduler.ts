import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import CronExpressionParser from "cron-parser";
import { PrismaClient } from "@owl/database";
import { TaskQueueService } from "./task-queue.service";

const CRON_CHECK_INTERVAL_MS = 60_000;

@Injectable()
export class TaskQueueScheduler {
  private readonly logger = new Logger(TaskQueueScheduler.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly taskQueueService: TaskQueueService
  ) {}

  @Cron("* * * * *")
  async check() {
    const now = new Date();
    const configs = await this.prisma.schedulerConfig.findMany({
      where: { enabled: true },
    });

    for (const config of configs) {
      if (this.isDue(config.cron, now)) {
        try {
          await this.taskQueueService.dispatch(config.area, config.handler);
        } catch (error) {
          this.logger.error(`Failed to dispatch ${config.area}:${config.handler}`, error);
        }
      }
    }
  }

  private isDue(cronExpression: string, now: Date): boolean {
    try {
      const interval = CronExpressionParser.parse(cronExpression, { currentDate: now });
      const previous = interval.prev().toDate();
      const diff = now.getTime() - previous.getTime();
      return diff < CRON_CHECK_INTERVAL_MS;
    } catch {
      return false;
    }
  }
}
