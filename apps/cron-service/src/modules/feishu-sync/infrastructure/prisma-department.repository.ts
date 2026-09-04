import { Injectable } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@owl/database";
import type { DepartmentRepositoryPort, FeishuDepartment } from "../domain/feishu-sync.ports";

@Injectable()
export class PrismaDepartmentRepository implements DepartmentRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceAll(depts: FeishuDepartment[]): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.department.deleteMany();

      for (const dept of depts) {
        await tx.department.create({
          data: {
            feishuDepartmentId: dept.feishuId,
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
          },
        });
      }
    });
  }
}
