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

**文件大小硬性规则**：单个代码文件不得超过 **1500 行**，超限必须拆分（页面拆子组件、逻辑抽 hooks、常量/类型下沉）。
该规则由 `pnpm arch:check` 全仓统一校验（前后端同一阈值，另含 >1000 行阻断级预警），不在 `frontend:check` 重复实现。

> **拆出来的子组件放哪**：`check_page_naming` 要求 `pages/` 目录下的一切 `.tsx` 只能是 `XxxPage.tsx` 或
> `index.tsx`。因此从页面拆出的子组件要放 `src/components/`（或 `src/pages/<feature>/` 之外），
> 不要直接放在 `pages/` 下，否则会被判为「页面组件命名错误」。

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

> **标准样板（可直接复制）**：web 端 `apps/admin-web/src/pages/SampleListPage.tsx`，
> mobile 端 `apps/mobile-web/src/pages/SampleListPage.tsx`。两者是业务无关的列表页模板：
> 四段式结构、加载骨架屏、操作列固定右侧且只用 icon、超长文本截断 + Tooltip（移动端为卡片列表 + 「加载更多」）。
> 新增列表页以对应端的文件为模板，改写存量页面时以它为目标。真实业务里按该结构落地的例子见
> `apps/admin-web/src/pages/MdDocsPage.tsx`。

### 样板页浏览器预览

预览用 mock 数据、不依赖后端；改完样板页重新构建即可看到效果：

```bash
cd apps/admin-web && npx vite build --config preview/vite.config.mts    # 产物 → preview/web
cd apps/mobile-web && npx vite build --config preview/vite.config.mts   # 产物 → preview/mobile
```

构建后在浏览器打开仓库根 `index.html`，左右并排显示两端样板。用 iframe 隔离是因为两端的尺寸体系不同
（web 用 px、mobile 用 rem + `html` font-size 50px），无法共用一个 Tailwind 产物。

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

// 列表页骨架屏（Arco web 文字占位用 text，图片占位用 image）
function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* 标题区骨架 */}
      <Skeleton text={{ rows: 1 }} />

      {/* 筛选区骨架 */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton text={{ rows: 2 }} />
      </div>

      {/* 列表区骨架 */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton text={{ rows: 8 }} />
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
   - CSS Modules (`*.module.css` / `*.module.scss` / `*.module.less`)
   - styled 文件与 styled-components / emotion
   - 业务自建 `.css`：各前端只允许唯一的 Tailwind 入口 `src/index.css`（第三方包 css 不受限，如 `vditor/dist/index.css`）
   - 内联 style（除 Arco 组件必要属性）
   - 硬编码颜色 HEX（使用 Tailwind 调色板）
3. **响应式**：
   - Web 端：固定桌面布局（无响应式）
   - Mobile 端：使用 `dvh`、`fixed` 定位、触摸友好尺寸

上述「禁止」项由 `check_style_solution` 自动校验；内联 style 由 `check_inline_style` 校验（列入白名单的
Arco 属性是**前缀匹配**：`style={{ width: 300 }}` 放行，但同一行里再叠加其他任意属性也会一并放行，需人工留意）；
硬编码颜色只自动查引号内的 HEX，`rgb()` / `hsl()` 需人工确认。

### 设计 token 的单一来源

设计基线放在仓库根 `tailwind/`，各端 config 只引用、不自带：

| 预设                  | 适用范围                                | 内容                                                                |
| --------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `tailwind/web.cjs`    | admin-web / owl-web / cron-web / portal | 语义色 `brand` / `danger` / `success` / `warning`，及既有中性色约定 |
| `tailwind/mobile.cjs` | mobile-web                              | rem 尺寸体系：`spacing` 以 0.08rem 为步长、字号与圆角按 rem         |

改风格只改这两个文件，各端同时生效，不存在「改了 3 个漏了 1 个」的漂移。各端配置禁止自带 `theme` / `plugins`
（由 `check_tailwind_single_source` 校验）。新增颜色请加到预设的语义色里，不要在页面直接写 `blue-*` 等原始色阶。

## 八、检查规则

AI 写完前端代码后必须运行 `pnpm frontend:check`。清单分三类：**脚本阻断项**由门禁自动校验，检出即阻断；
**跨脚本覆盖**由其他门禁负责（同一规则只有一个实现）；**人工评审项**无法用脚本可靠判定，必须人工确认。

### 8.1 脚本阻断项（`pnpm frontend:check` 检出即阻断）

| #   | 规则                                                                                                                                                            | 校验实现                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | 页面组件必须 `PascalCase + Page.tsx`（`pages/` 下）                                                                                                             | `check_page_naming`                                  |
| 2   | UI 库与应用类型严格匹配，禁止跨端导入                                                                                                                           | `check_ui_library_cross_import`                      |
| 3   | 禁止内联 style（Arco 必要属性如 `width` / `height` 除外）                                                                                                       | `check_inline_style`                                 |
| 4   | 禁止硬编码颜色值（引号内 HEX），用 Tailwind 调色板                                                                                                              | `check_hardcoded_colors`                             |
| 5   | 操作反馈用对组件（web `Notification` / mobile `Notify`）                                                                                                        | `check_notification_component`                       |
| 6   | 页面有 loading 状态必须使用 `Skeleton` 骨架屏                                                                                                                   | `check_skeleton_loading`（见下方说明，**当前漏报**） |
| 7   | 图片上传必须用公共组件 `ImageUpload`（禁止裸 `Upload` / `input type=file`，admin-web）                                                                          | `check_image_upload_component`                       |
| 8   | 禁止 CSS Modules / styled-components / emotion / 业务自建 `.css`，样式统一 Tailwind（各端仅一个入口 `index.css`；预览入口 `apps/*/preview/index.css` 同样合规） | `check_style_solution`                               |
| 9   | 设计 token 单一来源：各端 `tailwind.config` 只能 `content` + `presets`，禁止自带 `theme` / `plugins`                                                            | `check_tailwind_single_source`                       |

> **第 6 条的检测缺陷（已知，勿依赖）**：`check_skeleton_loading` 用 `useState.*loading` 匹配加载状态，
> 要求 `useState` 出现在 `loading` **之前**，因此对最常见写法 `const [loading, setLoading] = useState(false)`
> 完全匹配不上，实际长期处于漏报状态。修正检测后当前有 **21/28 个页面**会报违规（存量页面普遍用
> `Table loading` 而非骨架屏）。是否修正检测并迁移这 21 个页面，待决策；在决策前请按 8.3 人工确认。

### 8.2 跨脚本覆盖（同属前端规范，由其他门禁校验）

| 规则                                        | 校验入口                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| 禁止 emoji / 颜文字                         | `scan-ai-residue.sh` 第 10 条（`scripts/lib/find-emoji.mjs`）              |
| 禁止 `any`                                  | `scan-ai-residue.sh` 第 1 条 + ESLint `@typescript-eslint/no-explicit-any` |
| 单文件 ≤ 1500 行（另有 >1000 行阻断级预警） | `pnpm arch:check`                                                          |
| 前端禁止跨 app `import`                     | `pnpm arch:check` 第 10 条                                                 |

### 8.3 人工评审项（脚本无法可靠校验，提交前人工确认）

- 目录组织：`src/{api,components,pages,store,utils}`，新增目录需说明理由。
- 禁止自研 UI 组件：必须使用 `package.json` 中已有的 UI 库组件。
- 列表页布局四段式：页面标题区 → 筛选区表单 → 列表外操作区（右靠齐）→ 列表区。
- 列表操作列固定在右侧，使用 icon 按钮 + `Tooltip` 显示操作名称。
- 列表字段超长文本（超过 12 个字符）截断并悬浮显示全文。
- 骨架屏：**必须人工确认**。第 6 条的自动检测当前漏报（见 8.1 说明），存量 21 个页面普遍用 `Table loading`
  替代骨架屏；新增页面请照样板（`MdDocsPage.tsx`）直接给整页骨架屏。
- 响应式约定：Web 端固定桌面布局；Mobile 端使用 `dvh` / `fixed` 定位 / 触摸友好尺寸。

### 8.4 存量偏离清单（待迁移，新增代码不得模仿）

| 项目       | 现状                                                   | 目标                                        |
| ---------- | ------------------------------------------------------ | ------------------------------------------- |
| 骨架屏     | 21/28 页面缺失，普遍用 `Table loading` 替代            | 整页骨架屏（`MdDocsPage.tsx` 已落地）       |
| 列表页结构 | 多数页面无筛选卡片、无列表外操作区、表格未包卡片       | 按第五节四段式结构                          |
| 操作列     | 未固定右侧，普遍是带文字的按钮                         | `fixed: "right"` + icon 按钮 + `Tooltip`    |
| 超长文本   | 多数列表未截断                                         | `max-w-[Npx] truncate` + `Tooltip` 显示全文 |
| 任意值语法 | 少量 `text-[28px]` / `h-[calc(100vh-66px)]` 等脱离刻度 | 改用设计刻度内的取值                        |

## 九、Web 端 / Mobile 端差异速查

两端规则不拆成两份文档：**通用规则（emoji、`any`、文件行数、命名、上传组件）两端完全相同**，
按端拆份会变成两处维护、两处漂移；**端特有规则（下表）取值互斥**，用并列对照比拆文件更好查。

| 维度     | Web 端（admin-web / owl-web / cron-web / portal） | Mobile 端（mobile-web）                            |
| -------- | ------------------------------------------------- | -------------------------------------------------- |
| UI 库    | `@arco-design/web-react`                          | `@arco-design/mobile-react`                        |
| 图标     | `@arco-design/web-react/icon`                     | `@arco-design/mobile-react/esm/icon`               |
| 布局     | `ArcoLayout`（`Sider` + `Content`）               | 纯 Tailwind + `TabBar`                             |
| 反馈组件 | `Notification`                                    | `Notify`                                           |
| 加载提示 | `Spin`（列表页用 `Skeleton`）                     | `Toast.loading()`                                  |
| 尺寸体系 | px，固定桌面布局（无响应式）                      | rem 等比（`html` font-size 50px），`dvh` / `fixed` |
| 设计基线 | `tailwind/web.cjs`                                | `tailwind/mobile.cjs`                              |
| 页面命名 | `XxxPage.tsx`                                     | `XxxPage.tsx`                                      |

运行检查：`pnpm frontend:check`
