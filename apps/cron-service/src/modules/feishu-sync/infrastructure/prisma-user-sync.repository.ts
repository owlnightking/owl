import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { UserSyncRepositoryPort, FeishuUser } from "../domain/feishu-sync.ports";

@Injectable()
export class PrismaUserSyncRepository implements UserSyncRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertBatch(users: FeishuUser[]): Promise<void> {
    const deptByOpenId = new Map<string, string>();
    const depts = await this.prisma.department.findMany({
      select: { feishuDepartmentId: true, openDepartmentId: true },
    });
    for (const d of depts) {
      if (d.openDepartmentId) deptByOpenId.set(d.openDepartmentId, d.feishuDepartmentId);
    }

    for (const user of users) {
      const localDeptId = user.departmentId ? (deptByOpenId.get(user.departmentId) ?? user.departmentId) : null;
      const validDeptId =
        localDeptId && depts.some((dept) => dept.feishuDepartmentId === localDeptId) ? localDeptId : null;

      await this.prisma.user.upsert({
        where: { unionId: user.unionId },
        create: {
          unionId: user.unionId,
          openId: user.openId,
          name: user.name,
          nickname: user.nickname,
          enName: user.enName,
          description: user.description,
          email: user.email,
          avatar72: user.avatar72,
          avatar240: user.avatar240,
          avatar640: user.avatar640,
          avatarOrigin: user.avatarOrigin,
          mobileVisible: user.mobileVisible,
          departmentIds: user.departmentIds ?? undefined,
          departmentId: validDeptId,
        },
        update: {
          openId: user.openId,
          name: user.name,
          nickname: user.nickname,
          enName: user.enName,
          description: user.description,
          email: user.email,
          avatar72: user.avatar72,
          avatar240: user.avatar240,
          avatar640: user.avatar640,
          avatarOrigin: user.avatarOrigin,
          mobileVisible: user.mobileVisible,
          departmentIds: user.departmentIds ?? undefined,
          departmentId: validDeptId,
        },
      });
    }
  }
}
