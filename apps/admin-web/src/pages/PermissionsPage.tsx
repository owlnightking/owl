import { useEffect, useState } from "react";
import { Card, Tag, Table, Button, Message, Spin } from "@arco-design/web-react";
import { APP_ROUTES, type RouteConfig } from "@owl/permission";
import { get, post } from "../api/client";

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}

export function PermissionsPage() {
  const [backendPermissions, setBackendPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadBackendPermissions = async () => {
    setLoading(true);
    try {
      const perms = await get<PermissionItem[]>("/roles/permissions");
      setBackendPermissions(perms);
    } catch {
      setBackendPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBackendPermissions();
  }, []);

  const isPermissionSynced = (code: string) => {
    return backendPermissions.some((p) => p.code === code);
  };

  const getUnsyncedPermissions = () => {
    const unsynced: Array<{ app: string; route: RouteConfig }> = [];
    for (const app of APP_ROUTES) {
      for (const route of app.routes) {
        if (!isPermissionSynced(route.permission)) {
          unsynced.push({ app: app.app, route });
        }
      }
    }
    return unsynced;
  };

  const handleSync = async () => {
    const unsynced = getUnsyncedPermissions();
    if (unsynced.length === 0) {
      Message.info("所有权限已同步");
      return;
    }

    setSyncing(true);
    try {
      await post("/roles/permissions/sync", {
        permissions: unsynced.map(({ app, route }) => ({
          code: route.permission,
          name: route.name,
          resource: app,
          action: "view",
        })),
      });
      Message.success(`已同步 ${unsynced.length} 个权限`);
      await loadBackendPermissions();
    } catch {
      Message.error("同步失败");
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      title: "应用",
      dataIndex: "app",
      width: 120,
      render: (app: string) => {
        const appConfig = APP_ROUTES.find((a) => a.app === app);
        return <Tag color="blue">{appConfig?.name ?? app}</Tag>;
      },
    },
    {
      title: "页面",
      dataIndex: "name",
      width: 180,
    },
    {
      title: "权限编码",
      dataIndex: "permission",
    },
    {
      title: "状态",
      dataIndex: "synced",
      width: 100,
      render: (synced: boolean) => <Tag color={synced ? "green" : "orange"}>{synced ? "已同步" : "未同步"}</Tag>,
    },
  ];

  const dataSource = APP_ROUTES.flatMap((app) =>
    app.routes.map((route) => ({
      key: `${app.app}:${route.permission}`,
      app: app.app,
      name: route.name,
      path: route.path,
      permission: route.permission,
      synced: isPermissionSynced(route.permission),
    }))
  );

  const unsyncedCount = getUnsyncedPermissions().length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">权限配置</h2>
          <p className="mt-1 text-sm text-gray-500">管理所有应用的权限点，新增路由后在此页面同步到后端</p>
        </div>
        <Button type="primary" loading={syncing} onClick={handleSync} disabled={unsyncedCount === 0}>
          {unsyncedCount > 0 ? `同步 ${unsyncedCount} 个权限` : "已全部同步"}
        </Button>
      </div>

      <Card>
        <Spin loading={loading}>
          <Table rowKey="key" columns={columns} data={dataSource} pagination={false} border={false} />
        </Spin>
      </Card>

      <Card className="mt-4" title="权限说明">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>权限编码规则：</strong>
            <code className="mx-1 rounded bg-gray-100 px-2 py-0.5">{"{app}:{resource}:{action}"}</code>
          </p>
          <p>
            <strong>示例：</strong>
            <code className="mx-1 rounded bg-gray-100 px-2 py-0.5">admin:users:view</code>
            表示管理后台-用户管理-查看权限
          </p>
          <p>
            <strong>使用方式：</strong>在角色管理页面为角色分配权限，子应用中通过权限编码控制按钮/页面的显示
          </p>
        </div>
      </Card>
    </div>
  );
}
