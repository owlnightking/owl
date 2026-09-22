import { Controller, Post, Body } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TaskQueueService } from "../../task-queue.service";
import { DispatchTaskDto } from "../../dto/dispatch-task.dto";
import { ok } from "../../../common/response/api-response";
import { BaseDataDispatchVo } from "./base-data.vo";

@ApiTags("基础数据同步")
@Controller("task-queue/base-data")
export class BaseDataController {
  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Post()
  @ApiOperation({ summary: "投递基础数据同步任务" })
  @ApiCreatedResponse({ description: "投递成功", type: BaseDataDispatchVo })
  async dispatch(@Body() dto: DispatchTaskDto) {
    return ok(await this.taskQueueService.dispatch("base-data", dto.name ?? dto.task ?? "", dto.params));
  }
}
