import { Controller, Delete, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { FILE_SERVICE, type FileItem } from "../domain/file.ports";
import { FileUseCase } from "../application/file.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

const DEFAULT_PAGE_SIZE = 20;

class FileQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("files")
export class FileController {
  constructor(
    @Inject(FILE_SERVICE)
    private readonly service: FileUseCase
  ) {}

  @Get()
  @RequirePermission("common:file:read")
  async list(@Query() query: FileQueryDto, @Inject("CURRENT_USER_ID") userId?: string) {
    const result = await this.service.listByUser(userId ?? "", {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
    });
    return ok({
      items: result.items.map(this.toResponse),
      total: result.total,
    });
  }

  @Get(":id")
  @RequirePermission("common:file:read")
  async findById(@Param("id") id: string) {
    const item = await this.service.findById(id);
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @RequirePermission("common:file:delete")
  async remove(@Param("id") id: string) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: FileItem) {
    return {
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      size: item.size,
      bucket: item.bucket,
      objectKey: item.objectKey,
      url: item.url,
      uploadedBy: item.uploadedBy,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
