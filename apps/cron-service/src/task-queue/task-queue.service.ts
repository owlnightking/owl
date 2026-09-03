import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import { TaskQueuePublisher } from "./task-queue.publisher";
import { randomUUID } from "node:crypto";

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly publisher: TaskQueuePublisher
  ) {}

  async dispatch(area: string, taskName: string, params?: Record<string, unknown>) {
    const config = await this.prisma.schedulerConfig.findFirst({
      where: { area, handler: taskName },
    });

    const run = await this.prisma.schedulerRun.create({
      data: {
        taskRunId: randomUUID(),
        configId: config?.id ?? "",
        area,
        taskName,
        scheduledAt: new Date(),
        status: "PENDING",
      },
    });

    await this.publisher.publish(area, taskName, run.id, params);
    this.logger.log(`Dispatched ${area}:${taskName} (runId: ${run.id})`);

    return { runId: run.id };
  }
}
