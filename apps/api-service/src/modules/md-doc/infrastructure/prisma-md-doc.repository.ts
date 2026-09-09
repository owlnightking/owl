import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  MdDocCreateInput,
  MdDocItem,
  MdDocListQuery,
  MdDocRepositoryPort,
  MdDocUpdateInput,
} from "../domain/md-doc.ports";

function extractExcerpt(content: string): string | null {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.replace(/^#+\s*/, "").trim();
    if (trimmed.length > 0) {
      return trimmed.length > 100 ? trimmed.slice(0, 100) : trimmed;
    }
  }
  return null;
}

@Injectable()
export class PrismaMdDocRepository implements MdDocRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<MdDocItem | null> {
    const row = await this.prisma.mdDoc.findUnique({ where: { id } });
    return row
      ? {
          id: row.id,
          authorId: row.authorId,
          content: row.content,
          excerpt: row.excerpt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      : null;
  }

  async listByAuthor(authorId: string, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }> {
    const where: Record<string, unknown> = { authorId };
    if (query.q) {
      where.OR = [
        { content: { contains: query.q, mode: "insensitive" } },
        { excerpt: { contains: query.q, mode: "insensitive" } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.prisma.mdDoc.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.mdDoc.count({ where }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        authorId: r.authorId,
        content: r.content,
        excerpt: r.excerpt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
    };
  }

  async listAll(query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (query.q) {
      where.OR = [
        { content: { contains: query.q, mode: "insensitive" } },
        { excerpt: { contains: query.q, mode: "insensitive" } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.prisma.mdDoc.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.mdDoc.count({ where }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        authorId: r.authorId,
        content: r.content,
        excerpt: r.excerpt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
    };
  }

  async create(authorId: string, input: MdDocCreateInput): Promise<MdDocItem> {
    const row = await this.prisma.mdDoc.create({
      data: { authorId, content: input.content, excerpt: extractExcerpt(input.content) },
    });
    return {
      id: row.id,
      authorId: row.authorId,
      content: row.content,
      excerpt: row.excerpt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async update(id: string, input: MdDocUpdateInput): Promise<void> {
    await this.prisma.mdDoc.update({
      where: { id },
      data: { content: input.content, excerpt: extractExcerpt(input.content) },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mdDoc.delete({ where: { id } });
  }
}
