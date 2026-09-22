/**
 * 权限配置 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 只读页面：无新增 / 编辑 / 删除 / 多选能力，操作行只保留「刷新」。
 * 列表数据来自 @owl/permission 的路由表（本地常量），因此分页在前端切片；同步状态通过与
 * /roles/permissions 比对得出。原先的「同步」按钮已移除——其调用的 POST /roles/permissions/sync
 * 后端并不存在。
 */
import { useCallback, useEffect, useState } from "react";
import { Button, Notification, Pagination, Spin, Table, Tag, Tooltip } from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";
import { APP_ROUTES } from "@owl/permission";
import { get } from "../api/client";

interface PermissionItem {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function PermissionsPage() {
  const [backendPermissions, setBackendPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadBackendPermissions = useCallback(async () => {
    setLoading(true);
    try {
      setBackendPermissions(await get<PermissionItem[]>("/roles/permissions"));
    } catch (error) {
      setBackendPermissions([]);
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "权限列表加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBackendPermissions();
  }, [loadBackendPermissions]);

  const syncedCodes = new Set(backendPermissions.map((item) => item.code));

  const allRows = APP_ROUTES.flatMap((app) =>
    app.routes.map((route) => ({
      key: `${app.app}:${route.permission}`,
      app: app.app,
      appName: app.name,
      name: route.name,
      path: route.path,
      permission: route.permission,
      synced: syncedCodes.has(route.permission),
    }))
  );
  const unsyncedCount = allRows.filter((row) => !row.synced).length;
  const pagedRows = allRows.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "应用",
      dataIndex: "app",
      fixed: "left" as const,
      width: 140,
      render: (_: unknown, record: (typeof allRows)[number]) => <Tag color="blue">{record.appName}</Tag>,
    },
    { title: "页面", dataIndex: "name", width: 200 },
    {
      title: "权限编码",
      dataIndex: "permission",
      width: 280,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[260px] truncate font-mono text-xs text-gray-600">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "synced",
      width: 110,
      render: (value: boolean) => <Tag color={value ? "green" : "orange"}>{value ? "已同步" : "未同步"}</Tag>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-gray-800">权限配置</h1>
          <span className="text-sm text-gray-400">
            管理所有应用的权限点，共 {allRows.length} 个，其中未同步 {unsyncedCount} 个
          </span>
        </div>
      </div>

      {/* 2. 操作行：只读页面，仅保留刷新 */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip content="刷新">
          <Button icon={<IconRefresh />} onClick={() => void loadBackendPermissions()} />
        </Tooltip>
      </div>

      {/* 3. 列表区：Spin 点指示符 + 前端分页（数据来自本地路由表） */}
      <div>
        <Spin loading={loading} dot block>
          <Table rowKey="key" columns={columns} data={pagedRows} pagination={false} scroll={{ x: 730 }} />
        </Spin>
        <div className="mt-4 flex justify-end">
          <Pagination
            showTotal={(count) => `共 ${count} 条`}
            total={allRows.length}
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

      {/* 4. 权限说明：无卡片容器 */}
      <div className="flex flex-col gap-2 text-sm text-gray-600">
        <div className="text-sm font-medium text-gray-800">权限说明</div>
        <p>
          权限编码规则：
          <code className="mx-1 rounded bg-gray-100 px-2 py-0.5">{"{app}:{resource}:{action}"}</code>
        </p>
        <p>
          示例：
          <code className="mx-1 rounded bg-gray-100 px-2 py-0.5">admin:users:view</code>
          表示管理后台-用户管理-查看权限
        </p>
        <p>使用方式：在角色管理页面为角色分配权限，子应用中通过权限编码控制按钮/页面的显示</p>
      </div>
    </div>
  );
}
