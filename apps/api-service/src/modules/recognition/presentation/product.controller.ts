import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PRODUCT_SERVICE, type ProductItem } from "../domain/product.ports";
import { ProductUseCase } from "../application/product.use-case";

const DEFAULT_PAGE_SIZE = 20;
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

class CreateProductDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsNotEmpty() price!: number;
  @IsOptional() stock?: number;
  @IsOptional() enabled?: boolean;
  @IsOptional() sortOrder?: number;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() price?: number;
  @IsOptional() stock?: number;
  @IsOptional() enabled?: boolean;
  @IsOptional() sortOrder?: number;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition/products")
export class ProductController {
  constructor(@Inject(PRODUCT_SERVICE) private readonly service: ProductUseCase) {}

  @Get()
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("enabledOnly") enabledOnly?: string
  ) {
    const result = await this.service.list({
      enabledOnly: enabledOnly === "true",
      page: Number(page) || 1,
      pageSize: Number(pageSize) || DEFAULT_PAGE_SIZE,
    });
    return ok({ items: result.items.map(this.toResponse), total: result.total });
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @RequirePermission("recognition:product:create")
  async create(@Body() dto: CreateProductDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @RequirePermission("recognition:product:update")
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @RequirePermission("recognition:product:delete")
  async remove(@Param("id") id: string) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: ProductItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
