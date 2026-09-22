import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { FILE_SERVICE, type FileItem } from "../domain/file.ports";
import { MAX_IMAGE_BYTES } from "../domain/file-upload";
import { FileService } from "../application/file.service";
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";
import { FilePageVo, FileVo } from "./file.vo";

const DEFAULT_PAGE_SIZE = 20;

class FileQueryDto {
  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: "每页条数", example: 20, default: 20 })
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

@ApiTags("文件管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("files")
export class FileController {
  constructor(
    @Inject(FILE_SERVICE)
    private readonly service: FileService
  ) {}

  @Get()
  @RequirePermission("common:file:read")
  @ApiOperation({ summary: "文件分页列表" })
  @ApiOkResponse({ description: "当前用户文件分页列表", type: FilePageVo })
  async list(@Query() query: FileQueryDto, @CurrentUser() user: AuthPrincipal) {
    const pageNum = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.service.listByUser(Number(user.userId), { page: pageNum, pageSize });
    return page(result.items.map(this.toResponse), pageNum, pageSize, result.total);
  }

  @Get(":id")
  @RequirePermission("common:file:read")
  @ApiOperation({ summary: "文件详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "文件详情", type: FileVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    const item = await this.service.findById(id);
    return ok(this.toResponse(item));
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  @ApiOperation({ summary: "上传文件" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary", description: "文件" },
      },
    },
  })
  @ApiCreatedResponse({ description: "上传成功", type: FileVo })
  async uploadImage(@UploadedFile() file: UploadedImageFile | undefined, @CurrentUser() user: AuthPrincipal) {
    if (!file) {
      throw new BadRequestException("未接收到上传文件");
    }
    const item = await this.service.uploadImage({
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      body: file.buffer,
      uploadedBy: Number(user.userId),
    });
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @RequirePermission("common:file:delete")
  @ApiOperation({ summary: "删除文件" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
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
