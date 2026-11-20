import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { APP_ROUTES, PERMISSION_REGISTRY, type PermissionNodeDef } from "@owl/permission";
import {
  PERMISSION_REPOSITORY,
  type PermissionCreateInput,
  type PermissionItem,
  type PermissionRepositoryPort,
  type PermissionServicePort,
  type PermissionTreeNode,
  type PermissionTreeResult,
  type PermissionUpdateInput,
} from "../domain/permission.ports";
import { splitPermissionCode } from "../infrastructure/prisma-permission.repository";

/** 手工节点编码：模块:资源:动作，允许额外的中段（如 admin:users:tab:history） */
const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)+$/;

@Injectable()
export class PermissionService implements PermissionServicePort {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly repo: PermissionRepositoryPort) {}

  async list(): Promise<PermissionItem[]> {
    return this.repo.list();
  }

  async tree(roleId?: number): Promise<PermissionTreeResult> {
    const items = await this.repo.list();
    const byCode = new Map(items.map((item) => [item.code, item]));
    const byParent = new Map<number, PermissionItem[]>();
    for (const item of items) {
      if (item.parentId === null) continue;
      const siblings = byParent.get(item.parentId) ?? [];
      siblings.push(item);
      byParent.set(item.parentId, siblings);
    }
    const registryCodes = new Set(PERMISSION_REGISTRY.map((item) => item.code));

    const build = (def: PermissionNodeDef, app: string): PermissionTreeNode => {
      const item = def.code ? byCode.get(def.code) : undefined;
      const children = (def.children ?? []).map((child) => build(child, app));
      if (item) {
        // 手工新增的 Tab/按钮没有注册表定义，按 parentId 挂到当前页面下
        const manual = (byParent.get(item.id) ?? []).filter((child) => !registryCodes.has(child.code));
        children.push(...manual.map((child) => this.buildManualNode(child, byParent)));
      }
      return {
        key: item ? `perm:${item.id}` : `group:${app}:${def.name}`,
        code: def.code ?? null,
        name: def.name,
        type: def.type,
        app,
        path: def.path,
        permissionId: item?.id ?? null,
        children,
      };
    };

    const nodes: PermissionTreeNode[] = APP_ROUTES.map((appConfig) => ({
      key: `app:${appConfig.app}`,
      code: null,
      name: appConfig.name,
      type: "directory",
      app: appConfig.app,
      permissionId: null,
      children: appConfig.nodes.map((def) => build(def, appConfig.app)),
    }));

    const checkedIds = roleId ? await this.repo.findRolePermissionIds(roleId) : [];
    return { nodes, checkedIds };
  }

  private buildManualNode(item: PermissionItem, byParent: Map<number, PermissionItem[]>): PermissionTreeNode {
    return {
      key: `perm:${item.id}`,
      code: item.code,
      name: item.name,
      type: item.type,
      app: item.app ?? "",
      path: item.path ?? undefined,
      permissionId: item.id,
      children: (byParent.get(item.id) ?? []).map((child) => this.buildManualNode(child, byParent)),
    };
  }

  async sync(): Promise<{ synced: number }> {
    const defs = PERMISSION_REGISTRY.map((item) => ({
      code: item.code,
      name: item.name,
      type: item.type,
      app: item.app,
      path: item.path,
      parentCode: item.parentCode,
      sort: item.sort,
    }));
    const synced = await this.repo.sync(defs);
    return { synced };
  }

  async create(input: PermissionCreateInput): Promise<PermissionItem> {
    this.assertCode(input.code);
    const parent = await this.repo.findById(input.parentId);
    if (!parent) {
      throw new NotFoundException(`父级权限 ${input.parentId} 不存在`);
    }
    if (parent.type === "button") {
      throw new BadRequestException("按钮下不能再添加节点");
    }
    if (parent.type === "tab" && input.type !== "button") {
      throw new BadRequestException("Tab 下只能添加按钮");
    }
    const existing = await this.repo.findByCode(input.code);
    if (existing) {
      throw new ConflictException(`权限编码已存在: ${input.code}`);
    }
    const { resource, action } = splitPermissionCode(input.code);
    return this.repo.create({ ...input, resource, action });
  }

  async update(id: number, input: PermissionUpdateInput): Promise<PermissionItem> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(`权限 ${id} 不存在`);
    }
    const item = await this.repo.update(id, input);
    if (!item) {
      throw new NotFoundException(`权限 ${id} 不存在`);
    }
    return item;
  }

  async delete(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(`权限 ${id} 不存在`);
    }
    await this.repo.delete(id);
  }

  private assertCode(code: string): void {
    if (!PERMISSION_CODE_PATTERN.test(code)) {
      throw new BadRequestException("权限编码格式应为 模块:资源:动作，例如 system:user:create");
    }
  }
}
