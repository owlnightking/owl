import { Controller, Post, Body } from "@nestjs/common";
import { TaskQueueService } from "./task-queue.service";
import { DispatchTaskDto } from "./dto/dispatch-task.dto";
import { ok } from "../common/response/api-response";

@Controller("task-queue")
export class TaskQueueController {
  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Post()
  async trigger(@Body() dto: DispatchTaskDto & { area: string }) {
    return ok(await this.taskQueueService.dispatch(dto.area, dto.name ?? dto.task ?? "", dto.params));
  }
}
