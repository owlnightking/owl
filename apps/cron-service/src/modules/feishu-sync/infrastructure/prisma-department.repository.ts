import { Injectable } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@owl/database";
import type { DepartmentRepositoryPort, DepartmentSyncResult, FeishuDepartment } from "../domain/feishu-sync.ports";

@Injectable()
export class PrismaDepartmentRepository implements DepartmentRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceAll(depts: FeishuDepartment[]): Promise<DepartmentSyncResult> {
    if (depts.length === 0) {
      // 空列表由 Service 中止；此处双保险，禁止清空本地部门
      return { upserted: 0, hardDeleted: 0 };
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<DepartmentSyncResult> => {
      const feishuIds = depts.map((dept) => dept.feishuId);
      // ADR 014：孤儿部门硬删（唯一允许 deleteMany 的路径）
      const deleted = await tx.department.deleteMany({
        where: { feishuDepartmentId: { notIn: feishuIds } },
      });

      for (const dept of depts) {
        const data = {
          openDepartmentId: dept.openDepartmentId,
          name: dept.name,
          i18nName: dept.i18nName ?? undefined,
          parentId: dept.parentId,
          order: dept.order,
          leaderUserId: dept.leaderUserId,
          leaders: dept.leaders ?? undefined,
          memberCount: dept.memberCount,
          primaryMemberCount: dept.primaryMemberCount,
          isDeleted: dept.isDeleted ?? false,
        };
        await tx.department.upsert({
          where: { feishuDepartmentId: dept.feishuId },
          create: { feishuDepartmentId: dept.feishuId, ...data },
          update: { ...data, deletedAt: null },
        });
      }

      return { upserted: depts.length, hardDeleted: deleted.count };
    });
  }
}
