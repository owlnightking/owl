import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FieldConfigController } from "./presentation/field-config.controller";
import { PrismaFieldConfigRepository } from "./infrastructure/prisma-field-config.repository";
import { FIELD_CONFIG_REPOSITORY } from "./domain/field-config.ports";

@Module({
  imports: [AuthModule],
  controllers: [FieldConfigController],
  providers: [PrismaFieldConfigRepository, { provide: FIELD_CONFIG_REPOSITORY, useClass: PrismaFieldConfigRepository }],
  exports: [FIELD_CONFIG_REPOSITORY],
})
export class FieldConfigModule {}
