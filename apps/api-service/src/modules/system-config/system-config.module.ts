import { Module } from "@nestjs/common";
import { SystemConfigUseCase } from "./application/system-config.use-case";
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
    { provide: SYSTEM_CONFIG_SERVICE, useClass: SystemConfigUseCase },
  ],
  exports: [SYSTEM_CONFIG_SERVICE],
})
export class SystemConfigModule {}
