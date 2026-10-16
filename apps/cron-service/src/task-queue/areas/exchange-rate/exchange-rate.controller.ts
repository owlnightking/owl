import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TaskQueueService } from "../../task-queue.service";
import { DispatchTaskDto } from "../../dto/dispatch-task.dto";
import { ok } from "../../../common/response/api-response";
import { ExchangeRateDispatchVo } from "./exchange-rate.vo";

@ApiTags("汇率同步")
@Controller("task-queue/exchange-rate")
export class ExchangeRateController {
  constructor(private readonly taskQueueService: TaskQueueService) {}

  @Post()
  @ApiOperation({ summary: "投递汇率抓取任务" })
  @ApiCreatedResponse({ description: "投递成功", type: ExchangeRateDispatchVo })
  async dispatch(@Body() dto: DispatchTaskDto) {
    return ok(await this.taskQueueService.dispatch("exchange-rate", dto.name ?? dto.task ?? "sync", dto.params));
  }
}
