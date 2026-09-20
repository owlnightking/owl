# 前端 UI 规范

> AI Agent 在编写前端布局代码前必须先读本文件，写完后运行 `pnpm frontend:check` 验证。

## 一、组件命名

| 类型       | 命名模式                | 示例                             |
| ---------- | ----------------------- | -------------------------------- |
| 页面组件   | `PascalCase + Page.tsx` | `UsersPage.tsx`, `TasksPage.tsx` |
| 布局组件   | `PascalCase/index.tsx`  | `Layout/index.tsx`               |
| 通用组件   | `PascalCase.tsx`        | `AuthGuard.tsx`, `TabBar.tsx`    |
| 第三方封装 | `PascalCase.tsx`        | `VditorEditor.tsx`               |
| API 模块   | `kebab-case.ts`         | `client.ts`, `scheduler.ts`      |
| Store      | `camelCase.ts`          | `auth.ts`                        |

## 二、目录组织

```
src/
  api/           # API 封装
  components/    # 可复用组件
  pages/         # 页面组件
  store/         # Zustand store
  utils/         # 工具函数
```

## 三、UI 库使用

### 硬性规则

1. **禁止自己开发前端 UI 组件**：必须使用 `package.json` 中已有的 UI 库组件
2. **web 端使用 web 端组件，mobile 端使用移动端组件**：严格匹配，禁止跨端使用

| 应用       | 允许的 UI 库                | 禁止的 UI 库                |
| ---------- | --------------------------- | --------------------------- |
| admin-web  | `@arco-design/web-react`    | `@arco-design/mobile-react` |
| cron-web   | `@arco-design/web-react`    | `@arco-design/mobile-react` |
| owl-web    | `@arco-design/web-react`    | `@arco-design/mobile-react` |
| portal     | `@arco-design/web-react`    | `@arco-design/mobile-react` |
| mobile-web | `@arco-design/mobile-react` | `@arco-design/web-react`    |

### 组件引入

```tsx
// Web 端 - 组件
import { Layout, Menu, Table, Button, Notification } from "@arco-design/web-react";
// Web 端 - 图标
import { IconHome, IconSettings } from "@arco-design/web-react/icon";

// Mobile 端 - 组件
import { Toast, Notify, Textarea } from "@arco-design/mobile-react";
// Mobile 端 - 图标
import { IconHome, IconNotice } from "@arco-design/mobile-react/esm/icon";
```

### 操作反馈组件

| 场景     | Web 端                                                         | Mobile 端                                 |
| -------- | -------------------------------------------------------------- | ----------------------------------------- |
| 成功提示 | `Notification.success({ title: '成功', content: '操作成功' })` | `Notify.success({ content: '操作成功' })` |
| 失败提示 | `Notification.error({ title: '失败', content: '操作失败' })`   | `Notify.error({ content: '操作失败' })`   |
| 警告提示 | `Notification.warning({ title: '警告', content: '...' })`      | `Notify.warning({ content: '...' })`      |
| 加载提示 | `Spin` 组件                                                    | `Toast.loading()`                         |

### 图片上传（强制公共组件）

Web 端图片上传统一使用 `apps/admin-web/src/components/ImageUpload.tsx`：内置「上传前裁剪」（基于 `Upload.beforeUpload` + `react-image-crop`，裁剪框可拖拽、四角缩放，图片可放大缩小/旋转），自动上传到 MinIO、回传图片地址，支持预览与删除。

```tsx
import { ImageUpload } from "../components/ImageUpload";

// 方图（徽章 / 头像）
<ImageUpload value={iconUrl} onChange={setIconUrl} />

// 自定义比例（商品图 4:3）
<ImageUpload value={coverUrl} onChange={setCoverUrl} aspect={4 / 3} />
```

**禁止**：

- 在页面/业务组件中直接使用 `@arco-design/web-react` 的 `<Upload>`
- 直接使用原生 `<input type="file">`
- 自行实现裁剪/上传逻辑（应扩展公共组件）

> 需要在新应用（cron-web / owl-web / portal / mobile-web）复用时，先把该组件下沉为共享包，再同步扩展本规则与 `scripts/check-frontend-rules.sh`。

## 四、布局规范

### Web 端（admin-web / cron-web / owl-web / portal）

```tsx
// 必须使用 ArcoLayout
<Layout height="100%">
  <Layout.Sider width={200} theme="light" collapsible>
    <Menu theme="light">{/* 菜单项 */}</Menu>
  </Layout.Sider>
  <Layout.Content className="flex flex-col overflow-auto bg-gray-50 p-3">
    <div className="flex-1 overflow-auto bg-white p-6">
      <Breadcrumb />
      <Outlet />
    </div>
  </Layout.Content>
</Layout>
```

**禁止**：

- 内联 style（除 Arco 组件必要属性如 `width`、`height`）
- 使用 CSS Modules / styled-components
- 硬编码颜色值（使用 Tailwind 调色板）

### Mobile 端（mobile-web）

```tsx
// 纯 Tailwind 布局
<div className="min-h-dvh bg-gray-100">
  <div className="px-4 pt-4 pb-20">{/* 页面内容 */}</div>
  <TabBar /> {/* fixed bottom-0 */}
</div>
```

**禁止**：

- 导入 `@arco-design/web-react`
- 使用 ArcoLayout

## 五、列表页布局规范

### 标准列表页结构

```tsx
<div className="flex flex-col gap-4">
  {/* 1. 页面标题区 */}
  <div className="flex items-center justify-between">
    <h1 className="text-xl font-semibold">页面标题</h1>
  </div>

  {/* 2. 筛选区表单 */}
  <div className="rounded-lg bg-white p-4 shadow-sm">
    <Form layout="inline">{/* 筛选表单 */}</Form>
  </div>

  {/* 3. 列表外操作区 - 右靠齐，只展示 icon，悬浮显示文字 */}
  <div className="flex items-center justify-end gap-2">
    <Tooltip content="新增">
      <Button type="primary" icon={<IconPlus />} />
    </Tooltip>
    <Tooltip content="导出">
      <Button icon={<IconDownload />} />
    </Tooltip>
  </div>

  {/* 4. 列表区 */}
  <div className="rounded-lg bg-white p-4 shadow-sm">
    <Table columns={columns} data={data} />
    <div className="mt-4 flex justify-end">
      <Pagination total={total} current={current} onChange={setCurrent} />
    </div>
  </div>
</div>
```

### 列表字段规范

1. **超长文本截断**：超过 12 个字符使用 `...` 展示，悬浮显示全部内容
2. **列表操作列**：固定在右侧，使用 icon 按钮，悬浮显示操作名称

```tsx
// 列表字段配置示例
const columns = [
  {
    title: "名称",
    dataIndex: "name",
    render: (text) => (
      <Tooltip content={text}>
        <span className="block max-w-[200px] truncate">{text}</span>
      </Tooltip>
    ),
  },
  {
    title: "操作",
    dataIndex: "actions",
    fixed: "right",
    width: 120,
    render: (_, record) => (
      <Space>
        <Tooltip content="编辑">
          <Button type="text" icon={<IconEdit />} onClick={() => handleEdit(record)} />
        </Tooltip>
        <Tooltip content="删除">
          <Button type="text" status="danger" icon={<IconDelete />} onClick={() => handleDelete(record)} />
        </Tooltip>
      </Space>
    ),
  },
];
```

## 六、骨架屏加载规范

### 硬性规则

**每个区域都必须使用骨架屏加载**：数据加载时显示 Skeleton 组件，提升用户体验。

### Web 端骨架屏

```tsx
import { Skeleton } from "@arco-design/web-react";

// 列表页骨架屏
function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* 标题区骨架 */}
      <Skeleton paragraph={{ rows: 1 }} />

      {/* 筛选区骨架 */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton paragraph={{ rows: 2 }} />
      </div>

      {/* 列表区骨架 */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton paragraph={{ rows: 8 }} />
      </div>
    </div>
  );
}
```

### Mobile 端骨架屏

```tsx
import { Skeleton } from "@arco-design/mobile-react";

// 列表页骨架屏
function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* 标题区骨架 */}
      <Skeleton title paragraph={{ rows: 1 }} />

      {/* 列表项骨架 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg bg-white p-4">
          <Skeleton title paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
  );
}
```

### 使用示例

```tsx
function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    // 实际页面内容
  );
}
```

## 七、样式规范

1. **100% 使用 Tailwind CSS 工具类**
2. **禁止**：
   - CSS Modules (`*.module.css`)
   - styled-components / emotion
   - 内联 style（除 Arco 组件必要属性）
   - 硬编码颜色 HEX/RGB（使用 Tailwind 调色板）
3. **响应式**：
   - Web 端：固定桌面布局（无响应式）
   - Mobile 端：使用 `dvh`、`fixed` 定位、触摸友好尺寸

## 八、检查规则

AI 写完前端代码后，必须检查：

- [ ] 组件命名是否符合规范
- [ ] 目录组织是否正确
- [ ] UI 库导入是否匹配应用类型
- [ ] 是否使用了 package.json 中已有的 UI 组件（禁止自研）
- [ ] 操作反馈是否使用正确的组件（web: Notification, mobile: Notify）
- [ ] 图片上传是否使用公共组件 ImageUpload（禁止裸 Upload / input type=file）
- [ ] 列表页布局是否符合规范（标题→筛选→操作→列表）
- [ ] 列表操作列是否固定在右侧且使用 icon
- [ ] 列表字段超长文本是否截断并悬浮显示
- [ ] 每个区域是否使用骨架屏加载
- [ ] 样式是否使用 Tailwind
- [ ] 是否有内联 style
- [ ] 是否有硬编码颜色值
- [ ] 是否有 emoji/颜文字

以上任一问题均为 ERROR 级别，`pnpm frontend:check` 检出即阻断提交。

运行检查：`pnpm frontend:check`
