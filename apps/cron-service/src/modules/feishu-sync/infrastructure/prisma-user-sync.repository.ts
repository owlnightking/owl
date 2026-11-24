import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { UserSyncRepositoryPort, UserSyncResult, FeishuUser } from "../domain/feishu-sync.ports";

@Injectable()
export class PrismaUserSyncRepository implements UserSyncRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertBatch(users: FeishuUser[]): Promise<UserSyncResult> {
    if (users.length === 0) {
      // 空列表由 Service 中止；此处双保险，禁止软删全部用户
      return { created: 0, updated: 0, softDeleted: 0 };
    }

    const deptByOpenId = new Map<string, string>();
    const depts = await this.prisma.department.findMany({
      where: { deletedAt: null },
      select: { feishuDepartmentId: true, openDepartmentId: true },
    });
    for (const d of depts) {
      if (d.openDepartmentId) deptByOpenId.set(d.openDepartmentId, d.feishuDepartmentId);
    }

    let created = 0;
    let updated = 0;
    const presentUnionIds: string[] = [];

    for (const user of users) {
      presentUnionIds.push(user.unionId);
      const localDeptId = user.departmentId ? (deptByOpenId.get(user.departmentId) ?? user.departmentId) : null;
      const validDeptId =
        localDeptId && depts.some((dept) => dept.feishuDepartmentId === localDeptId) ? localDeptId : null;

      const existing = await this.prisma.user.findUnique({
        where: { unionId: user.unionId },
        select: { id: true },
      });

      const payload = {
        openId: user.openId,
        name: user.name,
        nickname: user.nickname ?? null,
        enName: user.enName ?? null,
        description: user.description ?? null,
        email: user.email ?? null,
        avatar72: user.avatar72 ?? null,
        avatar240: user.avatar240 ?? null,
        avatar640: user.avatar640 ?? null,
        avatarOrigin: user.avatarOrigin ?? null,
        mobileVisible: user.mobileVisible ?? null,
        departmentIds: user.departmentIds ?? undefined,
        departmentId: validDeptId,
      };

      if (existing) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { ...payload, deletedAt: null },
        });
        updated += 1;
      } else {
        await this.prisma.user.create({
          data: { unionId: user.unionId, ...payload },
        });
        created += 1;
      }
    }

    // 离职：本次全量未出现且仍在线的用户软删（ADR 014）
    const softDeleted = await this.prisma.user.updateMany({
      where: { deletedAt: null, unionId: { notIn: presentUnionIds } },
      data: { deletedAt: new Date() },
    });

    return { created, updated, softDeleted: softDeleted.count };
  }
}
