import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BADGE_SERVICE, type BadgeItem } from "../domain/badge.ports";
import { BadgeUseCase } from "../application/badge.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

class CreateBadgeDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsInt() coinReward?: number;
  @IsOptional() @Type(() => Number) @IsInt() expReward?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

class UpdateBadgeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsInt() coinReward?: number;
  @IsOptional() @Type(() => Number) @IsInt() expReward?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition/badges")
export class BadgeController {
  constructor(@Inject(BADGE_SERVICE) private readonly service: BadgeUseCase) {}

  @Get()
  @RequirePermission("recognition:badge:read")
  async list() {
    return ok((await this.service.list()).map(this.toResponse));
  }

  @Get(":id")
  @RequirePermission("recognition:badge:read")
  async findById(@Param("id") id: string) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @RequirePermission("recognition:badge:write")
  async create(@Body() dto: CreateBadgeDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @RequirePermission("recognition:badge:write")
  async update(@Param("id") id: string, @Body() dto: UpdateBadgeDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @RequirePermission("recognition:badge:write")
  async remove(@Param("id") id: string) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: BadgeItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
