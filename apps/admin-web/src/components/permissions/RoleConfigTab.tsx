/**
 * 配置 Tab —— 左侧角色 CRUD，右侧权限树（页面/菜单来自 common 菜单树，按钮可手工增删）。
 * 权限树数据来自 GET /permissions/tree；勾选后写回角色 permissionIds。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Notification,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
  type TreeProps,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import {
  TYPE_LABEL,
  type PermissionTreeNode,
  type PermissionTreeResult,
  type RoleItem,
  type RolePageData,
} from "./types";

type DrawerMode = "create" | "edit" | "add-node";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增角色",
  edit: "编辑角色",
  "add-node": "新增按钮 / Tab",
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
/** 系统角色编码：不可删除（与后端 RoleService 一致） */
const SYSTEM_ROLE_CODES = new Set(["super_admin"]);

function roleDeleteDisabled(record: RoleItem): { disabled: boolean; reason: string } {
  if (record.isSystem || SYSTEM_ROLE_CODES.has(record.code)) {
    return { disabled: true, reason: "系统角色不可删除" };
  }
  if (record.groups.length > 0) {
    return { disabled: true, reason: "仍被用户组绑定，请先解绑" };
  }
  return { disabled: false, reason: "" };
}

interface RoleFormValues {
  code?: string;
  name?: string;
  description?: string;
}

interface NodeFormValues {
  code?: string;
  name?: string;
  type?: "tab" | "button";
}

function collectCheckableKeys(nodes: PermissionTreeNode[], out: string[] = []): string[] {
  for (const node of nodes) {
    // 目录/菜单无 permissionId，不参与勾选；页面/Tab/按钮可勾选
    if (node.permissionId != null) out.push(node.key);
    if (node.children?.length) collectCheckableKeys(node.children, out);
  }
  return out;
}

function keyToPermissionId(key: string): number | null {
  if (!key.startsWith("perm:")) return null;
  const id = Number(key.slice(5));
  return Number.isFinite(id) ? id : null;
}

/** 按关键字过滤树：命中节点保留，父级链路保留 */
function filterTree(nodes: PermissionTreeNode[], keyword: string): PermissionTreeNode[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return nodes;
  const walk = (list: PermissionTreeNode[]): PermissionTreeNode[] => {
    const result: PermissionTreeNode[] = [];
    for (const node of list) {
      const children = walk(node.children ?? []);
      const hit =
        node.name.toLowerCase().includes(kw) || (node.code ?? "").toLowerCase().includes(kw) || children.length > 0;
      if (hit) {
        result.push({ ...node, children });
      }
    }
    return result;
  };
  return walk(nodes);
}

function findNodeByKey(nodes: PermissionTreeNode[], key: string): PermissionTreeNode | null {
  for (const node of nodes) {
    if (node.key === key) return node;
    const found = findNodeByKey(node.children ?? [], key);
    if (found) return found;
  }
  return null;
}

/** 权限树 → Arco TreeData：title 用名称，原始节点挂在 __node 供 renderTitle 使用 */
function toTreeData(nodes: PermissionTreeNode[]): NonNullable<TreeProps["treeData"]> {
  return nodes.map((node) => ({
    key: node.key,
    title: node.name,
    // 目录/菜单仅分组展示，不落库、不可勾选
    disableCheckbox: node.permissionId == null,
    children: node.children?.length ? toTreeData(node.children) : undefined,
    __node: node,
  }));
}

export function RoleConfigTab() {
  const [data, setData] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<RoleItem | null>(null);
  const [form] = Form.useForm<RoleFormValues>();
  const [nodeForm] = Form.useForm<NodeFormValues>();
  const [saving, setSaving] = useState(false);

  // 权限树
  const [treeNodes, setTreeNodes] = useState<PermissionTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [treeDirty, setTreeDirty] = useState(false);
  const [savingTree, setSavingTree] = useState(false);
  const [addParentKey, setAddParentKey] = useState<string | null>(null);

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<RolePageData>("/roles", {
        page: currentPage,
        pageSize: size,
        keyword: search || undefined,
      });
      setData(result.list);
      setTotal(result.total);
      // 默认选中第一行
      setSelectedRole((prev) => {
        if (prev) {
          const still = result.list.find((item) => item.id === prev.id);
          return still ?? result.list[0] ?? null;
        }
        return result.list[0] ?? null;
      });
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize, keyword);
  }, [page, pageSize, keyword, load]);

  const loadTree = useCallback(async (roleId?: number) => {
    setTreeLoading(true);
    try {
      const result = await get<PermissionTreeResult>("/permissions/tree", roleId ? { roleId } : undefined);
      setTreeNodes(result.nodes);
      setCheckedKeys(result.checkedIds.map((id) => `perm:${id}`));
      setTreeDirty(false);
      // 默认展开应用与一级菜单
      const roots: string[] = [];
      for (const app of result.nodes) {
        roots.push(app.key);
        for (const child of app.children ?? []) {
          if (child.type === "directory" || child.type === "menu") roots.push(child.key);
        }
      }
      setExpandedKeys(roots);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "权限树加载失败" });
      setTreeNodes([]);
      setCheckedKeys([]);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTree(selectedRole?.id);
  }, [selectedRole?.id, loadTree]);

  const filteredNodes = useMemo(() => filterTree(treeNodes, treeSearch), [treeNodes, treeSearch]);

  const checkedCount = useMemo(
    () => checkedKeys.map(keyToPermissionId).filter((id): id is number => id != null).length,
    [checkedKeys]
  );

  const checkableKeySet = useMemo(() => new Set(collectCheckableKeys(treeNodes)), [treeNodes]);

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(1);
  };

  const handleReset = () => {
    setInputValue("");
    setKeyword("");
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: RoleItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    setSaving(false);
    if (mode === "add-node") {
      nodeForm.resetFields();
      nodeForm.setFieldsValue({ type: "button" });
      return;
    }
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        description: record.description ?? "",
      });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
    setAddParentKey(null);
  };

  const saveRole = async () => {
    const values = await form.validate();
    setSaving(true);
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await put<void>(`/roles/${drawerRecord.id}`, {
          name: values.name,
          description: values.description,
          permissionIds: drawerRecord.permissions.map((item) => item.id),
        });
        Notification.success({ title: "成功", content: "角色已更新" });
      } else {
        await post<void>("/roles", {
          code: values.code,
          name: values.name,
          description: values.description,
          permissionIds: [],
        });
        Notification.success({ title: "成功", content: "角色已创建" });
      }
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (id: number) => {
    try {
      await del<void>(`/roles/${id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      if (selectedRole?.id === id) setSelectedRole(null);
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize, keyword);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const saveTree = async () => {
    if (!selectedRole) return;
    const permissionIds = checkedKeys.map(keyToPermissionId).filter((id): id is number => id != null);
    setSavingTree(true);
    try {
      // 仅提交 permissionIds：系统角色禁止改名/描述，后端对 name/description 会 409
      await put<void>(`/roles/${selectedRole.id}`, { permissionIds });
      Notification.success({ title: "成功", content: `已保存 ${permissionIds.length} 项权限` });
      setTreeDirty(false);
      const refreshed = await get<RolePageData>("/roles", { page, pageSize, keyword: keyword || undefined });
      setData(refreshed.list);
      setTotal(refreshed.total);
      const next = refreshed.list.find((item) => item.id === selectedRole.id);
      if (next) setSelectedRole(next);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "权限保存失败" });
    } finally {
      setSavingTree(false);
    }
  };

  const addNode = async () => {
    const values = await nodeForm.validate();
    const parent = addParentKey ? findNodeByKey(treeNodes, addParentKey) : null;
    if (!parent?.permissionId) {
      Notification.error({ title: "失败", content: "请选择页面或 Tab 作为父级" });
      return;
    }
    setSaving(true);
    try {
      await post<void>("/permissions", {
        code: values.code,
        name: values.name,
        type: values.type ?? "button",
        parentId: parent.permissionId,
      });
      Notification.success({ title: "成功", content: "权限节点已添加" });
      closeDrawer();
      await loadTree(selectedRole?.id);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "添加失败" });
    } finally {
      setSaving(false);
    }
  };

  const removeNode = async (node: PermissionTreeNode) => {
    if (node.permissionId == null) return;
    try {
      await del<void>(`/permissions/${node.permissionId}`);
      Notification.success({ title: "成功", content: "已删除" });
      // 若删除的是已勾选节点，同步移除
      setCheckedKeys((prev) => prev.filter((key) => key !== node.key));
      await loadTree(selectedRole?.id);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const handleCheck = (keys: (string | number)[]) => {
    // 只保留可勾选节点（页面/Tab/按钮），过滤目录与菜单等父级 key
    const allowed = keys.map(String).filter((key) => checkableKeySet.has(key));
    setCheckedKeys(allowed);
    setTreeDirty(true);
  };

  const expandAllPages = () => {
    const keys: string[] = [];
    const walk = (nodes: PermissionTreeNode[]) => {
      for (const node of nodes) {
        if (node.children?.length) {
          keys.push(node.key);
          walk(node.children);
        }
      }
    };
    walk(filteredNodes);
    setExpandedKeys(keys);
  };

  // 树节点渲染：名称 + 类型标签 + 编码 + 手工按钮操作
  const renderTitle = (node: PermissionTreeNode) => {
    const canAdd = node.type === "page" || node.type === "tab";
    // 页面/菜单/目录来自菜单树不可删；Tab 与按钮（含手工新增）可删
    const canDelete = node.permissionId != null && (node.type === "tab" || node.type === "button");
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Tag
          color={
            node.type === "page" ? "arcoblue" : node.type === "menu" || node.type === "directory" ? "green" : "purple"
          }
          className="shrink-0"
        >
          {TYPE_LABEL[node.type]}
        </Tag>
        <span className="truncate font-medium text-gray-800">{node.name}</span>
        {node.code ? <span className="truncate font-mono text-xs text-gray-400">{node.code}</span> : null}
        <Space size={2} className="ml-auto shrink-0">
          {canAdd ? (
            <Tooltip content="添加按钮 / Tab">
              <Button
                type="text"
                size="small"
                icon={<IconPlus />}
                onClick={(e) => {
                  e.stopPropagation();
                  setAddParentKey(node.key);
                  openDrawer("add-node");
                }}
              />
            </Tooltip>
          ) : null}
          {canDelete ? (
            <Popconfirm className="w-56" title="确认删除该节点及其子节点？" onOk={() => void removeNode(node)}>
              <Tooltip content="删除">
                <Button
                  type="text"
                  status="danger"
                  size="small"
                  icon={<IconDelete />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          ) : null}
        </Space>
      </span>
    );
  };

  return (
    <div className="flex min-h-[560px] flex-col gap-4">
      {/* 顶部：角色搜索 + 新增 + 权限保存 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="角色编码 / 名称"
          style={{ width: "100%" }}
          value={inputValue}
          onChange={setInputValue}
          onPressEnter={handleSearch}
        />
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 gap-4">
        {/* 左侧：角色 CRUD */}
        <div className="flex w-[420px] shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">角色（{total}）</span>
            <Tooltip content="新增角色">
              <Button type="primary" size="small" icon={<IconPlus />} onClick={() => openDrawer("create")} />
            </Tooltip>
          </div>
          <Spin loading={loading} dot block>
            <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto">
              {data.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400">暂无角色</div>
              ) : (
                data.map((record) => {
                  const deleteState = roleDeleteDisabled(record);
                  const isEditDisabled = record.isSystem || SYSTEM_ROLE_CODES.has(record.code);
                  return (
                    <div
                      key={record.id}
                      role="button"
                      tabIndex={0}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 ${
                        selectedRole?.id === record.id ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRole(record)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedRole(record);
                        }
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{record.name}</span>
                      <Tooltip content={isEditDisabled ? "系统角色不可编辑名称" : "编辑"}>
                        <Button
                          type="text"
                          size="small"
                          icon={<IconEdit />}
                          disabled={isEditDisabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer("edit", record);
                          }}
                        />
                      </Tooltip>
                      <Tooltip content={deleteState.reason || "删除"}>
                        <Popconfirm
                          className="w-56"
                          title="确认删除该角色？"
                          disabled={deleteState.disabled}
                          onOk={() => removeOne(record.id)}
                        >
                          <Button
                            type="text"
                            status="danger"
                            size="small"
                            icon={<IconDelete />}
                            disabled={deleteState.disabled}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  );
                })
              )}
            </div>
          </Spin>
          <div className="flex justify-end">
            <Pagination
              showTotal={(count) => `共 ${count} 条`}
              total={total}
              current={page}
              pageSize={pageSize}
              sizeCanChange
              sizeOptions={PAGE_SIZE_OPTIONS}
              onChange={(currentPage, currentSize) => {
                setPage(currentPage);
                setPageSize(currentSize);
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* 右侧：权限树 */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-700">权限树</span>
              {selectedRole ? (
                <>
                  <span className="text-sm text-gray-800">{selectedRole.name}</span>
                  <Tag color="blue">{checkedCount}</Tag>
                </>
              ) : (
                <span className="text-sm text-gray-400">请选择左侧角色</span>
              )}
            </div>
            <Space>
              <Button size="small" onClick={expandAllPages}>
                展开全部
              </Button>
              <Button size="small" onClick={() => void loadTree(selectedRole?.id)} disabled={!selectedRole}>
                <IconRefresh className="mr-1" />
                刷新
              </Button>
              <Button
                size="small"
                type="primary"
                disabled={!selectedRole || !treeDirty}
                loading={savingTree}
                onClick={saveTree}
              >
                保存权限
              </Button>
            </Space>
          </div>

          <Input placeholder="搜索菜单 / 页面 / Tab / 按钮" allowClear value={treeSearch} onChange={setTreeSearch} />

          <Spin loading={treeLoading} dot block>
            <div className="max-h-[480px] min-h-[320px] overflow-auto">
              {filteredNodes.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400">
                  {selectedRole ? "无匹配节点" : "请选择角色后加载权限树"}
                </div>
              ) : (
                <Tree
                  checkable
                  blockNode
                  autoExpandParent={Boolean(treeSearch)}
                  expandedKeys={treeSearch ? undefined : expandedKeys}
                  checkedKeys={checkedKeys}
                  treeData={toTreeData(filteredNodes)}
                  onCheck={(keys) => handleCheck(keys as string[])}
                  onExpand={(keys) => setExpandedKeys(keys as string[])}
                  renderTitle={(props) => {
                    const node = props.dataRef?.__node as PermissionTreeNode | undefined;
                    return node ? renderTitle(node) : String(props.title ?? "");
                  }}
                />
              )}
            </div>
          </Spin>

          <div className="text-xs text-gray-400">
            页面 / 菜单结构来自 common 菜单树（注册表同步）；按钮与 Tab
            需在节点上手工添加。勾选后点「保存权限」写入角色。
          </div>
        </div>
      </div>

      {/* 角色抽屉 */}
      <Drawer
        visible={drawerMode === "create" || drawerMode === "edit"}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={
          <>
            <Button onClick={closeDrawer} className="mr-2">
              取消
            </Button>
            <Button type="primary" loading={saving} onClick={saveRole}>
              保存
            </Button>
          </>
        }
        onCancel={closeDrawer}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="编码" field="code" rules={[{ required: true, message: "请输入角色编码" }]}>
            <Input placeholder="如 ops" disabled={drawerMode === "edit"} />
          </Form.Item>
          <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入角色名称" }]}>
            <Input placeholder="如 运维" />
          </Form.Item>
          <Form.Item label="描述" field="description">
            <Input.TextArea placeholder="角色说明（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>
          <div className="text-sm text-gray-500">创建后在右侧权限树勾选权限并保存。</div>
        </Form>
      </Drawer>

      {/* 新增按钮 / Tab */}
      <Modal
        visible={drawerMode === "add-node"}
        title={DRAWER_TITLE["add-node"]}
        onCancel={closeDrawer}
        onOk={() => void addNode()}
        confirmLoading={saving}
        okText="添加"
      >
        <Form form={nodeForm} layout="vertical">
          <Form.Item label="类型" field="type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="button">按钮</Select.Option>
              <Select.Option value="tab">Tab</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="编码"
            field="code"
            rules={[
              { required: true, message: "请输入权限编码" },
              {
                match: /^[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)+$/,
                message: "格式：模块:资源:动作，如 system:user:create",
              },
            ]}
          >
            <Input placeholder="如 system:user:create" />
          </Form.Item>
          <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入名称" }]}>
            <Input placeholder="如 新增用户" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
