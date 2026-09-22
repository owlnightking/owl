import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Inject,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth";
import { FIELD_CONFIG_SERVICE, type FieldConfigServicePort } from "../domain/field-config.ports";
import { ok, page } from "../../../common/response/api-response";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { FieldConfigPageVo, FieldConfigVo } from "./field-config.vo";

class ListFieldConfigsQueryDto {
  @ApiProperty({ description: "字段分类", example: "scheduler" })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: "模块 / 显示名称关键字", example: "cron" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: "每页条数", example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}

class CreateFieldConfigDto {
  @ApiProperty({ description: "字段分类", example: "order" })
  @IsString()
  category!: string;

  @ApiProperty({ description: "所属模块", example: "order-list" })
  @IsString()
  module!: string;

  @ApiProperty({ description: "字段显示名", example: "订单状态" })
  @IsString()
  label!: string;

  @ApiPropertyOptional({
    description: "可选项配置",
    type: Object,
    example: [{ label: "待付款", value: 1 }],
  })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ description: "字段值", example: "pending" })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: "字段说明", example: "订单当前状态" })
  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateFieldConfigDto {
  @ApiProperty({ description: "字段显示名", example: "订单状态" })
  @IsString()
  label!: string;

  @ApiPropertyOptional({
    description: "可选项配置",
    type: Object,
    example: [{ label: "待付款", value: 1 }],
  })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ description: "字段值", example: "pending" })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: "字段说明", example: "订单当前状态" })
  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags("字段配置")
@Controller("field-config")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FieldConfigController {
  constructor(@Inject(FIELD_CONFIG_SERVICE) private readonly service: FieldConfigServicePort) {}

  @Get()
  @ApiOperation({ summary: "按分类查询字段配置分页列表" })
  @ApiQuery({ name: "category", description: "字段分类", example: "order" })
  @ApiOkResponse({ description: "字段配置分页列表", type: FieldConfigPageVo })
  async list(@Query() query: ListFieldConfigsQueryDto) {
    const { items, total } = await this.service.list(query);
    return page(items, query.page, query.pageSize, total);
  }

  @Get("options")
  @ApiOperation({ summary: "按分类查询字段配置选项（不分页）" })
  @ApiQuery({ name: "category", description: "字段分类", example: "scheduler" })
  @ApiOkResponse({ description: "字段配置选项", type: [FieldConfigVo] })
  async options(@Query("category") category: string) {
    return ok(await this.service.listOptions(category));
  }

  @Get(":id")
  @ApiOperation({ summary: "字段配置详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "字段配置详情", type: FieldConfigVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.service.getById(id));
  }

  @Post()
  @RequirePermission("system-config:write")
  @ApiOperation({ summary: "创建字段配置" })
  @ApiCreatedResponse({ description: "创建成功", type: FieldConfigVo })
  async create(@Body() dto: CreateFieldConfigDto) {
    return ok(
      await this.service.upsert({
        category: dto.category,
        module: dto.module,
        label: dto.label,
        options: dto.options,
        value: dto.value,
        description: dto.description,
      })
    );
  }

  @Put(":id")
  @RequirePermission("system-config:write")
  @ApiOperation({ summary: "更新字段配置" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: FieldConfigVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateFieldConfigDto) {
    return ok(
      await this.service.updateById(id, {
        label: dto.label,
        options: dto.options,
        value: dto.value,
        description: dto.description,
      })
    );
  }

  @Delete(":id")
  @RequirePermission("system-config:write")
  @ApiOperation({ summary: "删除字段配置" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.deleteById(id);
    return ok(null);
  }
}
