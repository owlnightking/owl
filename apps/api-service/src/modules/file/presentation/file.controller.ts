import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { FILE_SERVICE, type FileItem } from "../domain/file.ports";
import { MAX_IMAGE_BYTES } from "../domain/file-upload";
import { FileUseCase } from "../application/file.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";

const DEFAULT_PAGE_SIZE = 20;

class FileQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
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
  async list(@Query() query: FileQueryDto, @CurrentUser() user: AuthPrincipal) {
    const result = await this.service.listByUser(user.userId, {
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

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadImage(@UploadedFile() file: UploadedImageFile | undefined, @CurrentUser() user: AuthPrincipal) {
    if (!file) {
      throw new BadRequestException("未接收到上传文件");
    }
    const item = await this.service.uploadImage({
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      body: file.buffer,
      uploadedBy: user.userId,
    });
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
