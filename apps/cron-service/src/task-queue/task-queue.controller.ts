import { Controller, Post, Body } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TaskQueueService } from "./task-queue.service";
import { DispatchTaskDto } from "./dto/dispatch-task.dto";
import { ok } from "../common/response/api-response";
import { DispatchTaskVo } from "./task-queue.vo";

@ApiTags("任务队列")
@Controller("task-queue")
export class TaskQueueController {
  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Post()
  @ApiOperation({ summary: "投递任务到任务队列" })
  @ApiCreatedResponse({ description: "投递成功", type: DispatchTaskVo })
  async trigger(@Body() dto: DispatchTaskDto & { area: string }) {
    return ok(await this.taskQueueService.dispatch(dto.area, dto.name ?? dto.task ?? "", dto.params));
  }
}
