/**
 * 权限配置 —— 系统管理下唯一入口（原「角色与权限」页已并入本页）。
 *
 * Tab 结构：
 *   1. 用户组 —— 用户组 CRUD、添加成员、挂钩角色
 *   2. 配置   —— 左侧角色 CRUD，右侧权限树（页面/菜单读 common 菜单树，按钮手工添加）
 *
 * 规范见 docs/frontend-rules.md；列表样板见 SampleListPage。
 */
import { useState } from "react";
import { Tabs } from "@arco-design/web-react";
import { UserGroupTab } from "../components/permissions/UserGroupTab";
import { RoleConfigTab } from "../components/permissions/RoleConfigTab";

type MainTab = "groups" | "config";

export function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("groups");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-semibold text-gray-800">权限配置</h1>
        <span className="text-sm text-gray-400">用户组 · 角色 · 权限树</span>
      </div>

      <Tabs activeTab={activeTab} onChange={(key) => setActiveTab(key as MainTab)}>
        <Tabs.TabPane key="groups" title="用户组">
          <UserGroupTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="config" title="配置">
          <RoleConfigTab />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
