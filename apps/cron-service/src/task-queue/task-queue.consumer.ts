import { Injectable, Logger } from "@nestjs/common";
import * as amqplib from "amqplib";
import { getTask } from "./task-registry";
import type { TaskMessage } from "./task-queue.publisher";
import { PrismaClient } from "@owl/database";

const TASK_EXCHANGE = "task-exchange";

@Injectable()
export class TaskQueueConsumer {
  private readonly logger = new Logger(TaskQueueConsumer.name);
  private channelModel: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(private readonly prisma: PrismaClient) {}

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? "amqp://admin:123456@localhost:5672";
    try {
      this.channelModel = await Promise.race([
        amqplib.connect(url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RabbitMQ connection timeout")), 10_000)),
      ]);
      this.channel = await this.channelModel.createChannel();
      await this.channel.assertExchange(TASK_EXCHANGE, "topic", { durable: true });
      await this.consumeQueue("task-queue:base-data");
      this.logger.log("Consumer started");
    } catch (error) {
      this.logger.error("Consumer connection failed", error);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.channelModel?.close();
  }

  private async consumeQueue(queue: string) {
    if (!this.channel) return;
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, TASK_EXCHANGE, queue);
    await this.channel.consume(queue, (msg) => this.handleMessage(msg));
  }

  private async handleMessage(msg: amqplib.ConsumeMessage | null) {
    if (!msg || !this.channel) return;

    const message = JSON.parse(msg.content.toString()) as TaskMessage;
    const { area, task, runId } = message;
    const key = `${area}:${task}`;

    this.logger.log(`Received task ${key} (runId: ${runId})`);

    const handler = getTask(area, task);
    if (!handler) {
      this.logger.error(`No handler found for ${key}`);
      await this.updateRunStatus(runId, "failed", `Handler not found: ${key}`);
      this.channel.ack(msg);
      return;
    }

    try {
      this.channel.ack(msg);
      await this.updateRunStatus(runId, "running");
      await handler(message.params);
      await this.updateRunStatus(runId, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task ${key} failed: ${errorMsg}`);
      await this.updateRunStatus(runId, "failed", errorMsg);
    }
  }

  private async updateRunStatus(runId: string, status: string, error?: string) {
    const data: Record<string, unknown> = { status };
    if (status === "running") data.startedAt = new Date();
    if (status === "success" || status === "failed") data.finishedAt = new Date();
    if (error) data.lastError = error;

    await this.prisma.schedulerRun.update({
      where: { id: runId },
      data,
    });
  }
}
