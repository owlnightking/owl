import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { MD_DOC_SERVICE, type MdDocItem } from "../domain/md-doc.ports";
import { MdDocUseCase } from "../application/md-doc.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionGuard, type AuthPrincipal } from "../../auth/index";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";

const DEFAULT_PAGE_SIZE = 20;
const ADMIN_ROLE_CODES = new Set(["super_admin", "admin"]);

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
  @IsString() @IsNotEmpty() content!: string;
}

class UpdateMdDocDto {
  @IsString() @IsNotEmpty() content!: string;
}

class MdDocQueryDto {
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) pageSize?: number;
  @IsOptional() @IsString() q?: string;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("md-docs")
export class MdDocController {
  constructor(
    @Inject(MD_DOC_SERVICE) private readonly service: MdDocUseCase,
    @Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient
  ) {}

  @Get()
  async list(@Query() query: MdDocQueryDto, @CurrentUser() user: AuthPrincipal) {
    const isAdmin = await this.isAdmin(user.userId);
    const result = await this.service.list(user.userId, isAdmin, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
      q: query.q,
    });
    return ok({ items: result.items.map((i) => this.toResponse(i)), total: result.total });
  }

  @Get(":id")
  async findById(@Param("id") id: string, @CurrentUser() user: AuthPrincipal) {
    const isAdmin = await this.isAdmin(user.userId);
    const doc = await this.service.findById(id, user.userId, isAdmin);
    return ok(this.toResponse(doc));
  }

  @Post()
  async create(@Body() dto: CreateMdDocDto, @CurrentUser() user: AuthPrincipal) {
    const doc = await this.service.create(user.userId, dto);
    return ok(this.toResponse(doc));
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateMdDocDto, @CurrentUser() user: AuthPrincipal) {
    const isAdmin = await this.isAdmin(user.userId);
    await this.service.update(id, user.userId, isAdmin, dto);
    return ok(undefined);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: AuthPrincipal) {
    const isAdmin = await this.isAdmin(user.userId);
    await this.service.delete(id, user.userId, isAdmin);
    return ok(undefined);
  }

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: MulterFile | undefined, @CurrentUser() user: AuthPrincipal) {
    if (!file) return ok({ url: "" });
    const ext = file.originalname.split(".").pop() ?? "png";
    const objectKey = `md-docs/${user.userId}/${Date.now()}.${ext}`;

    const bucket = process.env.MINIO_BUCKET ?? "owl";
    const host = process.env.MINIO_HOST ?? "localhost";
    const port = process.env.MINIO_PORT ?? "9000";
    const url = `http://${host}:${port}/${bucket}/${objectKey}`;

    const fileRecord = await this.prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        bucket,
        objectKey,
        url,
        uploadedBy: user.userId,
      },
    });

    return ok({ url, fileId: fileRecord.id });
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { code: true } } },
    });
    return roles.some(({ role }) => ADMIN_ROLE_CODES.has(role.code));
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
