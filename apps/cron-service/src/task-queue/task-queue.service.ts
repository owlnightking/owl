import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import { TaskQueuePublisher } from "./task-queue.publisher";
import { randomUUID } from "node:crypto";

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);
  private readonly currentEnv: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly publisher: TaskQueuePublisher
  ) {
    this.currentEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "dev";
  }

  async dispatch(area: string, taskName: string, params?: Record<string, unknown>) {
    const config = await this.prisma.schedulerConfig.findFirst({
      where: {
        area,
        handler: taskName,
        OR: [{ env: this.currentEnv }, { env: "all" }],
      },
    });

    const run = await this.prisma.schedulerRun.create({
      data: {
        taskRunId: randomUUID(),
        configId: config?.id ?? null,
        area,
        taskName,
        env: this.currentEnv,
        scheduledAt: new Date(),
        status: "PENDING",
      },
    });

    await this.publisher.publish(area, taskName, run.id, params);
    this.logger.log(`Dispatched ${area}:${taskName} (runId: ${run.id}, env: ${this.currentEnv})`);

    return { runId: run.id };
  }
}
