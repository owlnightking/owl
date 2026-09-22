import { Module } from "@nestjs/common";
import { SystemConfigService } from "./application/system-config.service";
import { SystemConfigController } from "./presentation/system-config.controller";
import { PrismaSystemConfigRepository } from "./infrastructure/prisma-system-config.repository";
import { SYSTEM_CONFIG_REPOSITORY, SYSTEM_CONFIG_SERVICE } from "./domain/system-config.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SystemConfigController],
  providers: [
    {
      provide: SYSTEM_CONFIG_REPOSITORY,
      useClass: PrismaSystemConfigRepository,
    },
    { provide: SYSTEM_CONFIG_SERVICE, useClass: SystemConfigService },
  ],
  exports: [SYSTEM_CONFIG_SERVICE],
})
export class SystemConfigModule {}
