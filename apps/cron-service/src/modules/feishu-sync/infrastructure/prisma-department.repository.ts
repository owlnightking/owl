import { Injectable } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@owl/database";
import type { DepartmentRepositoryPort, FeishuDepartment } from "../domain/feishu-sync.ports";

@Injectable()
export class PrismaDepartmentRepository implements DepartmentRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceAll(depts: FeishuDepartment[]): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const feishuIds = depts.map((dept) => dept.feishuId);
      await tx.department.updateMany({
        where: { feishuDepartmentId: { notIn: feishuIds }, deletedAt: null },
        data: { deletedAt: new Date() },
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
    });
  }
}
