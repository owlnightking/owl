import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { MD_DOC_SERVICE, type MdDocItem } from "../domain/md-doc.ports";
import { MdDocService } from "../application/md-doc.service";
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionGuard, type AuthPrincipal } from "../../auth/index";
import { MdDocPageVo, MdDocVo, UploadImageVo } from "./md-doc.vo";

const DEFAULT_PAGE_SIZE = 20;

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

class CreateMdDocDto {
  @ApiProperty({ description: "文档内容（Markdown）", example: "# 标题" })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

class UpdateMdDocDto {
  @ApiProperty({ description: "文档内容（Markdown）", example: "# 标题" })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

class MdDocQueryDto {
  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: "每页条数", example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({ description: "内容关键字", example: "标题" })
  @IsOptional()
  @IsString()
  q?: string;
}

@ApiTags("付费知识文档")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("md-docs")
export class MdDocController {
  constructor(@Inject(MD_DOC_SERVICE) private readonly service: MdDocService) {}

  @Get()
  @ApiOperation({ summary: "文档分页列表" })
  @ApiOkResponse({ description: "文档分页列表", type: MdDocPageVo })
  async list(@Query() query: MdDocQueryDto, @CurrentUser() user: AuthPrincipal) {
    const pageNum = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.service.list(Number(user.userId), { page: pageNum, pageSize, q: query.q });
    return page(
      result.items.map((i) => this.toResponse(i)),
      pageNum,
      pageSize,
      result.total
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "文档详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "文档详情", type: MdDocVo })
  async findById(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthPrincipal) {
    const doc = await this.service.findById(id, Number(user.userId));
    return ok(this.toResponse(doc));
  }

  @Post()
  @ApiOperation({ summary: "新建文档" })
  @ApiCreatedResponse({ description: "新建成功", type: MdDocVo })
  async create(@Body() dto: CreateMdDocDto, @CurrentUser() user: AuthPrincipal) {
    const doc = await this.service.create(Number(user.userId), dto);
    return ok(this.toResponse(doc));
  }

  @Put(":id")
  @ApiOperation({ summary: "编辑文档" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功" })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateMdDocDto, @CurrentUser() user: AuthPrincipal) {
    await this.service.update(id, Number(user.userId), dto);
    return ok(undefined);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除文档" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthPrincipal) {
    await this.service.delete(id, Number(user.userId));
    return ok(undefined);
  }

  @Post("upload-image")
  @ApiOperation({ summary: "上传文档图片" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary", description: "图片文件" },
      },
      required: ["file"],
    },
  })
  @ApiCreatedResponse({ description: "上传成功", type: UploadImageVo })
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: MulterFile | undefined, @CurrentUser() user: AuthPrincipal) {
    if (!file) return ok({ url: "" });
    const result = await this.service.uploadImage(Number(user.userId), file);
    return ok(result);
  }

  private toResponse(item: MdDocItem) {
    return {
      id: item.id,
      authorId: item.authorId,
      content: item.content,
      excerpt: item.excerpt,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
