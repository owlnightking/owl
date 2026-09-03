import { Controller, Get, Put, Delete, Param, Body, UseGuards, Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth";
import { FieldConfigUseCase } from "../application/field-config.use-case";
import { FIELD_CONFIG_REPOSITORY } from "../domain/field-config.ports";
import { PrismaFieldConfigRepository } from "../infrastructure/prisma-field-config.repository";
import { ok } from "../../../common/response/api-response";
import { IsOptional, IsString } from "class-validator";

class UpsertFieldConfigDto {
  @IsString()
  label!: string;

  @IsOptional()
  options?: unknown;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller("field-config")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FieldConfigController {
  private readonly useCase: FieldConfigUseCase;

  constructor(@Inject(FIELD_CONFIG_REPOSITORY) repo: PrismaFieldConfigRepository) {
    this.useCase = new FieldConfigUseCase(repo);
  }

  @Get(":category")
  async listByCategory(@Param("category") category: string) {
    return ok(await this.useCase.listByCategory(category));
  }

  @Get(":category/:module")
  async getByCategoryAndModule(@Param("category") category: string, @Param("module") module: string) {
    return ok(await this.useCase.getByCategoryAndModule(category, module));
  }

  @Put(":category/:module")
  @RequirePermission("system-config:write")
  async upsert(
    @Param("category") category: string,
    @Param("module") module: string,
    @Body() dto: UpsertFieldConfigDto
  ) {
    return ok(
      await this.useCase.upsert({
        category,
        module,
        label: dto.label,
        options: dto.options,
        value: dto.value,
        description: dto.description,
      })
    );
  }

  @Delete(":category/:module")
  @RequirePermission("system-config:write")
  async remove(@Param("category") category: string, @Param("module") module: string) {
    await this.useCase.deleteByKey(category, module);
    return ok(null);
  }
}
