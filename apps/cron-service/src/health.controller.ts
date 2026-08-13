import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "cron-service", time: new Date().toISOString() };
  }
}
