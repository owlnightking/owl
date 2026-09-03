import { Injectable, Logger } from "@nestjs/common";
import * as amqplib from "amqplib";

export interface TaskMessage {
  area: string;
  task: string;
  params?: Record<string, unknown>;
  runId: string;
  timestamp: number;
}

const TASK_EXCHANGE = "task-exchange";

@Injectable()
export class TaskQueuePublisher {
  private readonly logger = new Logger(TaskQueuePublisher.name);
  private channelModel: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? "amqp://admin:123456@localhost:5672";
    try {
      this.channelModel = await amqplib.connect(url);
      this.channel = await this.channelModel.createChannel();
      await this.channel.assertExchange(TASK_EXCHANGE, "topic", { durable: true });
      this.logger.log("RabbitMQ connected");
    } catch (error) {
      this.logger.error("RabbitMQ connection failed", error);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.channelModel?.close();
  }

  async publish(area: string, taskName: string, runId: string, params?: Record<string, unknown>) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }
    const queue = `task-queue:${area}`;
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, TASK_EXCHANGE, queue);

    const message: TaskMessage = { area, task: taskName, params, runId, timestamp: Date.now() };
    const buffer = Buffer.from(JSON.stringify(message));
    this.channel.publish(TASK_EXCHANGE, queue, buffer, { persistent: true });
    this.logger.log(`Published task ${area}:${taskName} to ${queue}`);
  }
}
