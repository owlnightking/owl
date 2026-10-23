import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { MdDocService } from "./md-doc.service";
import type { MdDocItem, MdDocRepositoryPort } from "../domain/md-doc.ports";

const OWNER_ID = 39;
const COLLABORATOR_ID = 40;
const STRANGER_ID = 41;
const DOC_ID = 3;
const FIRST_PAGE = 1;
const PAGE_SIZE = 10;

function buildDoc(overrides: Partial<MdDocItem> = {}): MdDocItem {
  return {
    id: DOC_ID,
    authorId: OWNER_ID,
    authorName: "武钦杉",
    authorAvatarUrl: "https://example.com/owner.png",
    updatedBy: OWNER_ID,
    updatedByName: "武钦杉",
    updatedByAvatarUrl: "https://example.com/owner.png",
    content: "# 记账",
    excerpt: "记账",
    createdAt: new Date("2026-10-11T14:48:21Z"),
    updatedAt: new Date("2026-10-11T14:48:21Z"),
    collaborators: [{ userId: COLLABORATOR_ID, name: "陶景曜", avatarUrl: "https://example.com/collab.png" }],
    ...overrides,
  };
}

function buildMocks(doc: MdDocItem | null = buildDoc()) {
  const repo: MdDocRepositoryPort = {
    findById: vi.fn(async () => doc),
    listAccessible: vi.fn(async () => ({ items: doc ? [doc] : [], total: doc ? 1 : 0 })),
    create: vi.fn(async (authorId) => buildDoc({ authorId, updatedBy: authorId })),
    update: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    listUserOptions: vi.fn(async () => []),
    findExistingUserIds: vi.fn(async (ids: number[]) => ids),
    listCollaborators: vi.fn(async () => buildDoc().collaborators),
    replaceCollaborators: vi.fn(async () => {}),
    createFileRecord: vi.fn(async () => 1),
  };
  return { repo, service: new MdDocService(repo) };
}

describe("MdDocService 可见性", () => {
  it("列表只查 owner + 共建人可访问的文档", async () => {
    const { repo, service } = buildMocks();

    await service.list(STRANGER_ID, { page: FIRST_PAGE, pageSize: PAGE_SIZE });

    expect(repo.listAccessible).toHaveBeenCalledWith(STRANGER_ID, { page: FIRST_PAGE, pageSize: PAGE_SIZE });
  });

  it("共建人可以查看文档", async () => {
    const { service } = buildMocks();

    const doc = await service.findById(DOC_ID, COLLABORATOR_ID);

    expect(doc.id).toBe(DOC_ID);
  });

  it("非 owner 且非共建人查看文档被拒绝", async () => {
    const { service } = buildMocks();

    await expect(service.findById(DOC_ID, STRANGER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("非 owner 且非共建人编辑文档被拒绝", async () => {
    const { repo, service } = buildMocks();

    await expect(service.update(DOC_ID, STRANGER_ID, { content: "# 篡改" })).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("非 owner 删除文档被拒绝（共建人也不行）", async () => {
    const { repo, service } = buildMocks();

    await expect(service.delete(DOC_ID, COLLABORATOR_ID)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

describe("MdDocService 共建人管理", () => {
  it("owner 可以设置共建人，并自动去重", async () => {
    const { repo, service } = buildMocks();

    await service.setCollaborators(DOC_ID, OWNER_ID, [COLLABORATOR_ID, COLLABORATOR_ID]);

    expect(repo.replaceCollaborators).toHaveBeenCalledWith(DOC_ID, [COLLABORATOR_ID]);
  });

  it("非 owner 不能设置共建人", async () => {
    const { repo, service } = buildMocks();

    await expect(service.setCollaborators(DOC_ID, COLLABORATOR_ID, [STRANGER_ID])).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(repo.replaceCollaborators).not.toHaveBeenCalled();
  });

  it("不允许把 owner 自己加为共建人", async () => {
    const { service } = buildMocks();

    await expect(service.setCollaborators(DOC_ID, OWNER_ID, [OWNER_ID])).rejects.toBeInstanceOf(BadRequestException);
  });

  it("更新文档时记录最后更新人", async () => {
    const { repo, service } = buildMocks();

    await service.update(DOC_ID, COLLABORATOR_ID, { content: "# 新内容" });

    expect(repo.update).toHaveBeenCalledWith(DOC_ID, { content: "# 新内容" }, COLLABORATOR_ID);
  });
});
