import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "./common/response/api-response";
import { HealthEnvVo, HealthVo } from "./health.vo";

@ApiTags("健康检查")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "服务健康检查" })
  @ApiOkResponse({ description: "服务健康状态", type: HealthVo })
  health() {
    return ok({ status: "ok", service: "cron-service", time: new Date().toISOString() });
  }

  @Get("env")
  @ApiOperation({ summary: "查询运行环境" })
  @ApiOkResponse({ description: "运行环境", type: HealthEnvVo })
  getEnv() {
    return ok({ env: process.env.APP_ENV ?? process.env.NODE_ENV ?? "dev" });
  }
}
