import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "./common/response/api-response";
import { HealthVo } from "./health.vo";

@ApiTags("健康检查")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "服务健康检查" })
  @ApiOkResponse({ description: "服务健康状态", type: HealthVo })
  health() {
    return ok({ status: "ok", service: "api-service", time: new Date().toISOString() });
  }
}
