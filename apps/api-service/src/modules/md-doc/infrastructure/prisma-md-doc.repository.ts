import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  MdDocCollaboratorItem,
  MdDocCreateInput,
  MdDocFileInput,
  MdDocItem,
  MdDocListQuery,
  MdDocRepositoryPort,
  MdDocUpdateInput,
  MdDocUserOption,
} from "../domain/md-doc.ports";

const USER_OPTION_LIMIT = 50;

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

const DOC_INCLUDE = {
  author: { select: { name: true, avatar240: true } },
  updater: { select: { name: true, avatar240: true } },
  collaborators: {
    where: { deletedAt: null, user: { deletedAt: null } },
    select: { userId: true, user: { select: { name: true, avatar240: true } } },
    orderBy: { createdAt: "asc" },
  },
} as const;

interface RawDoc {
  id: number;
  authorId: number;
  updatedBy: number | null;
  content: string;
  excerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string; avatar240: string | null } | null;
  updater: { name: string; avatar240: string | null } | null;
  collaborators: { userId: number; user: { name: string; avatar240: string | null } }[];
}

function keywordConditions(q?: string): Record<string, unknown>[] {
  if (!q) return [];
  return [{ content: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }];
}

@Injectable()
export class PrismaMdDocRepository implements MdDocRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: RawDoc): MdDocItem {
    return {
      id: raw.id,
      authorId: raw.authorId,
      authorName: raw.author?.name ?? null,
      authorAvatarUrl: raw.author?.avatar240 ?? null,
      updatedBy: raw.updatedBy,
      updatedByName: raw.updater?.name ?? null,
      updatedByAvatarUrl: raw.updater?.avatar240 ?? null,
      content: raw.content,
      excerpt: raw.excerpt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      collaborators: raw.collaborators.map((row) => ({
        userId: row.userId,
        name: row.user.name,
        avatarUrl: row.user.avatar240,
      })),
    };
  }

  async findById(id: number): Promise<MdDocItem | null> {
    const row = await this.prisma.mdDoc.findUnique({
      where: { id, deletedAt: null },
      include: DOC_INCLUDE,
    });
    return row ? this.toItem(row) : null;
  }

  async listAccessible(userId: number, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }> {
    const and: Record<string, unknown>[] = [
      { OR: [{ authorId: userId }, { collaborators: { some: { userId, deletedAt: null } } }] },
    ];
    const keyword = keywordConditions(query.q);
    if (keyword.length > 0) and.push({ OR: keyword });
    const where: Record<string, unknown> = { deletedAt: null, AND: and };
    const [rows, total] = await Promise.all([
      this.prisma.mdDoc.findMany({
        where,
        include: DOC_INCLUDE,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.mdDoc.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async create(authorId: number, input: MdDocCreateInput): Promise<MdDocItem> {
    const row = await this.prisma.mdDoc.create({
      data: {
        authorId,
        updatedBy: authorId,
        content: input.content,
        excerpt: extractExcerpt(input.content),
      },
      include: DOC_INCLUDE,
    });
    return this.toItem(row);
  }

  async update(id: number, input: MdDocUpdateInput, updatedBy: number): Promise<void> {
    await this.prisma.mdDoc.update({
      where: { id },
      data: { content: input.content, excerpt: extractExcerpt(input.content), updatedBy },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.mdDoc.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listUserOptions(keyword?: string): Promise<MdDocUserOption[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(keyword
          ? {
              OR: [
                { name: { contains: keyword, mode: "insensitive" as const } },
                { email: { contains: keyword, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true, avatar240: true },
      orderBy: { name: "asc" },
      take: USER_OPTION_LIMIT,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar240,
    }));
  }

  async findExistingUserIds(userIds: number[]): Promise<number[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async listCollaborators(docId: number): Promise<MdDocCollaboratorItem[]> {
    const rows = await this.prisma.mdDocCollaborator.findMany({
      where: { docId, deletedAt: null, user: { deletedAt: null } },
      select: { userId: true, user: { select: { name: true, avatar240: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ userId: row.userId, name: row.user.name, avatarUrl: row.user.avatar240 }));
  }

  async replaceCollaborators(docId: number, userIds: number[]): Promise<void> {
    const unique = [...new Set(userIds)];
    await this.prisma.$transaction(async (tx) => {
      await tx.mdDocCollaborator.updateMany({
        where: { docId, deletedAt: null, userId: { notIn: unique } },
        data: { deletedAt: new Date() },
      });
      for (const userId of unique) {
        await tx.mdDocCollaborator.upsert({
          where: { docId_userId: { docId, userId } },
          update: { deletedAt: null },
          create: { docId, userId },
        });
      }
    });
  }

  async createFileRecord(input: MdDocFileInput): Promise<number> {
    const row = await this.prisma.file.create({ data: input });
    return row.id;
  }
}
