import { Controller, Get } from "@nestjs/common";
import { ok } from "./common/response/api-response";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return ok({ status: "ok", service: "api-service", time: new Date().toISOString() });
  }
}
