import { describe, expect, it, vi } from "vitest";
import { FeishuSyncService } from "./feishu-sync.service";
import type {
  DepartmentRepositoryPort,
  FeishuDepartment,
  FeishuSyncPort,
  FeishuUser,
  SyncLogRepositoryPort,
  UserSyncRepositoryPort,
} from "../domain/feishu-sync.ports";

const SYNC_LOG_ID = 1;
const CREATED_COUNT = 1;
const UPDATED_COUNT = 0;
const SOFT_DELETED_COUNT = 2;
const HARD_DELETED_COUNT = 2;

const dept: FeishuDepartment = {
  feishuId: "d1",
  openDepartmentId: "od1",
  name: "技术部",
  parentId: null,
  order: 1,
};

const user: FeishuUser = {
  unionId: "u1",
  openId: "o1",
  name: "张三",
  nickname: "老张",
  departmentId: "od1",
  departmentIds: ["od1"],
};

function buildService(options?: {
  departments?: FeishuDepartment[];
  users?: FeishuUser[];
  deptError?: Error;
  userError?: Error;
}) {
  const feishuClient: FeishuSyncPort = {
    getTenantAccessToken: vi.fn(async () => "token"),
    getDepartmentTree: vi.fn(async () => options?.departments ?? [dept]),
    getAllUsers: vi.fn(async () => options?.users ?? [user]),
  };
  if (options?.deptError) {
    feishuClient.getDepartmentTree = vi.fn(async () => {
      throw options.deptError;
    });
  }
  if (options?.userError) {
    feishuClient.getAllUsers = vi.fn(async () => {
      throw options.userError;
    });
  }
  const deptRepo: DepartmentRepositoryPort = {
    replaceAll: vi.fn(async () => ({ upserted: CREATED_COUNT, hardDeleted: HARD_DELETED_COUNT })),
  };
  const userRepo: UserSyncRepositoryPort = {
    upsertBatch: vi.fn(async () => ({
      created: CREATED_COUNT,
      updated: UPDATED_COUNT,
      softDeleted: SOFT_DELETED_COUNT,
    })),
  };
  const syncLogRepo: SyncLogRepositoryPort = {
    create: vi.fn(async () => SYNC_LOG_ID),
    update: vi.fn(async () => undefined),
  };
  const service = new FeishuSyncService(feishuClient, deptRepo, userRepo, syncLogRepo);
  return { feishuClient, deptRepo, userRepo, syncLogRepo, service };
}

describe("FeishuSyncService.execute", () => {
  it("成功路径：先同步部门再同步用户，并写 success 日志", async () => {
    const { deptRepo, userRepo, syncLogRepo, service } = buildService();
    await service.execute();
    expect(deptRepo.replaceAll).toHaveBeenCalledWith([dept]);
    expect(userRepo.upsertBatch).toHaveBeenCalledWith([user]);
    expect(syncLogRepo.update).toHaveBeenCalledWith(
      SYNC_LOG_ID,
      expect.objectContaining({
        status: "success",
        total: CREATED_COUNT,
        created: CREATED_COUNT,
        updated: UPDATED_COUNT,
      })
    );
  });

  it("失败路径：部门拉取失败写 failed 日志并重新抛出", async () => {
    const { userRepo, syncLogRepo, service } = buildService({ deptError: new Error("dept down") });
    await expect(service.execute()).rejects.toThrow("dept down");
    expect(userRepo.upsertBatch).not.toHaveBeenCalled();
    expect(syncLogRepo.update).toHaveBeenCalledWith(
      SYNC_LOG_ID,
      expect.objectContaining({ status: "failed", errorMsg: "dept down" })
    );
  });

  it("空结果保护：飞书返回空部门列表时中止，不触达用户写入", async () => {
    const { deptRepo, userRepo, service } = buildService({ departments: [] });
    await expect(service.execute()).rejects.toThrow(/empty department list/);
    expect(deptRepo.replaceAll).not.toHaveBeenCalled();
    expect(userRepo.upsertBatch).not.toHaveBeenCalled();
  });

  it("空结果保护：飞书返回空用户列表时中止，不软删本地用户", async () => {
    const { userRepo, service } = buildService({ users: [] });
    await expect(service.execute()).rejects.toThrow(/empty user list/);
    expect(userRepo.upsertBatch).not.toHaveBeenCalled();
  });

  it("统计写入：created/updated 来自 upsertBatch 返回值写入日志", async () => {
    const { syncLogRepo, service } = buildService();
    await service.execute();
    expect(syncLogRepo.update).toHaveBeenCalledWith(
      SYNC_LOG_ID,
      expect.objectContaining({
        status: "success",
        total: CREATED_COUNT,
        created: CREATED_COUNT,
        updated: UPDATED_COUNT,
      })
    );
  });
});
