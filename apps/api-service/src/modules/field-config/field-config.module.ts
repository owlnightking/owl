import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FieldConfigController } from "./presentation/field-config.controller";
import { PrismaFieldConfigRepository } from "./infrastructure/prisma-field-config.repository";
import { FieldConfigService } from "./application/field-config.service";
import { FIELD_CONFIG_REPOSITORY, FIELD_CONFIG_SERVICE } from "./domain/field-config.ports";

@Module({
  imports: [AuthModule],
  controllers: [FieldConfigController],
  providers: [
    { provide: FIELD_CONFIG_REPOSITORY, useClass: PrismaFieldConfigRepository },
    { provide: FIELD_CONFIG_SERVICE, useClass: FieldConfigService },
  ],
  exports: [FIELD_CONFIG_SERVICE],
})
export class FieldConfigModule {}
