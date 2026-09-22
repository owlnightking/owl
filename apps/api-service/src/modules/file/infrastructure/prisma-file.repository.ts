import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { FileItem, FileRepositoryPort } from "../domain/file.ports";

@Injectable()
export class PrismaFileRepository implements FileRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    objectKey: string;
    url: string | null;
    uploadedBy: number;
    createdAt: Date;
  }): FileItem {
    return {
      id: raw.id,
      name: raw.name,
      mimeType: raw.mimeType,
      size: raw.size,
      bucket: raw.bucket,
      objectKey: raw.objectKey,
      url: raw.url,
      uploadedBy: raw.uploadedBy,
      createdAt: raw.createdAt,
    };
  }

  async findById(id: number): Promise<FileItem | null> {
    const row = await this.prisma.file.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async listByUser(
    userId: number,
    options?: { page: number; pageSize: number }
  ): Promise<{ items: FileItem[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const where = { uploadedBy: userId, deletedAt: null };

    const [rows, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.file.count({ where }),
    ]);

    return { items: rows.map(this.toItem), total };
  }

  async create(input: {
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    objectKey: string;
    url?: string;
    uploadedBy: number;
  }): Promise<FileItem> {
    const row = await this.prisma.file.create({
      data: {
        name: input.name,
        mimeType: input.mimeType,
        size: input.size,
        bucket: input.bucket,
        objectKey: input.objectKey,
        url: input.url,
        uploadedBy: input.uploadedBy,
      },
    });
    return this.toItem(row);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
