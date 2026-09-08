import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { FileItem, FileRepositoryPort } from "../domain/file.ports";

@Injectable()
export class PrismaFileRepository implements FileRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    objectKey: string;
    url: string | null;
    uploadedBy: string;
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

  async findById(id: string): Promise<FileItem | null> {
    const row = await this.prisma.file.findUnique({ where: { id } });
    return row ? this.toItem(row) : null;
  }

  async listByUser(
    userId: string,
    options?: { page: number; pageSize: number }
  ): Promise<{ items: FileItem[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const where = { uploadedBy: userId };

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
    uploadedBy: string;
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

  async delete(id: string): Promise<void> {
    await this.prisma.file.delete({ where: { id } });
  }
}
