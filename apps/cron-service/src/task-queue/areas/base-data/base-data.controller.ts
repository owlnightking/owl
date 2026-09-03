import { Controller, Post, Body } from "@nestjs/common";
import { TaskQueueService } from "../../task-queue.service";
import { DispatchTaskDto } from "../../dto/dispatch-task.dto";
import { ok } from "../../../common/response/api-response";

@Controller("task-queue/base-data")
export class BaseDataController {
  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Post()
  async dispatch(@Body() dto: DispatchTaskDto) {
    return ok(await this.taskQueueService.dispatch("base-data", dto.name ?? dto.task ?? "", dto.params));
  }
}
