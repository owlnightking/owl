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

### 页面级小 tab（分类 / 视图切换）

页面上用来切换**分类、状态等视图**的小 tab，统一用 `Tabs` 的胶囊样式——不要用 `Radio.Group type="button"`
或自绘分段控件（那是表单控件语义，且默认不满足这里的对齐与尺寸要求）：

```tsx
<Tabs type="capsule" size="small" className="w-fit shrink-0" activeTab={category} onChange={setCategory}>
  <Tabs.TabPane key="all" title="全部" />
  <Tabs.TabPane key="product" title="商品" />
</Tabs>
```

约定：

- `type="capsule"` + `size="small"`：胶囊小尺寸，与同排按钮高度协调。
- **`w-fit` 必加**：Arco 的 capsule 默认把头部右对齐（`.arco-tabs-header-nav-capsule .arco-tabs-header-wrapper{justify-content:flex-end}`），
  加 `w-fit` 让控件收缩到内容宽度才会左对齐；放在 flex 行里同时加 `shrink-0` 防止被压缩。
- `TabPane` 只给 `key` + `title`，不写 children：纯切换器不需要内容面板，也不会渲染空内容区。
- 首项固定「全部」；切换后**立即生效**（不需要再点查询），并把分页重置到第 1 页。
- 该维度已由 tab 承担时，筛选条件网格里**不要**再放同维度的条件，避免两个控件打架。

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
  <Layout.Content className="flex min-w-0 flex-col overflow-auto bg-gray-50 p-3">
    {/* 面包屑区：无背景 */}
    <div className="mb-3">
      <Breadcrumb />
    </div>
    {/* 页面内容区：白色背景 */}
    <div className="min-w-0 flex-1 overflow-auto rounded-lg bg-white p-6">
      <Outlet />
    </div>
  </Layout.Content>
</Layout>
```

**右侧内容区结构（统一）**：侧边栏右侧分为两块——**导航面包屑区（无背景）** + **页面内容区（白色背景 `bg-white`）**；面包屑不单独加背景/边框，直接落在页面底色上。

**`min-w-0` 必加**：`ArcoLayout` 是 `flex-direction: row` 的弹性容器，`Content` 与内容区都是它的子项，默认 `min-width: auto` 会按内容宽度计算，导致宽表格/长内容把整个布局撑宽——横向滚动条会落到页面（`body`）上，而不是留在列表内部。
给这两层加 `min-w-0` 是唯一确定性的修法（只放宽最小宽度，不影响正常页面）。

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
> mobile 端 `apps/mobile-web/src/pages/SampleListPage.tsx`。web 端模板包含：筛选条件网格（输入框 /
> 多选搜索 / 远程搜索 / 树形选择 / 时间选择器）、页面级 tab 分类切换、多选表格（选中后出现导出与批量删除）、
> 新增 / 编辑 / 详情共用的右侧抽屉、行操作（详情 / 编辑 / 删除，全部 icon + Tooltip）、列表 `Spin dot` 加载指示、
> 操作列固定右侧、超长文本截断 + Tooltip；mobile 端为卡片列表 + 「加载更多」。
> 新增列表页以对应端的文件为模板，改写存量页面时以它为目标。真实业务里按该结构落地的例子见
> `apps/admin-web/src/pages/MdDocsPage.tsx`。

### 在应用内查看样板页

样板页是**真实路由**，跑在各自应用里，内置示例数据、不依赖后端接口。`pnpm dev` 后走统一网关访问：

| 端     | 入口                        | dev 地址                                  | 生产路径              |
| ------ | --------------------------- | ----------------------------------------- | --------------------- |
| web    | 管理台左侧菜单「样板页」    | `http://localhost:5172/admin/sample-list` | `/admin/sample-list`  |
| mobile | 直接访问路由（未挂 TabBar） | `http://localhost:5173/sample-list`       | `/mobile/sample-list` |

（5172 / 5173 是 `WEB_GATEWAY_PORT` / `MOBILE_GATEWAY_PORT`，见 `.env.example`。admin-web 需先经
`http://localhost:5172/admin/mock-login` 登录。mobile 的 vite `base` 在 dev 下是 `/`、构建后是 `/mobile/`。）

调样板页就是在真实应用里调，改完刷新看到效果，不需要单独的预览工程。

### 标准列表页结构

```tsx
<div className="flex flex-col gap-4">
  {/* 1. 页面标题区 */}
  <div className="flex items-center justify-between">
    <h1 className="text-xl font-semibold">页面标题</h1>
  </div>

  {/* 2. 筛选区 - 条件网格（多列，条件数不限），搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
  <div className="grid grid-cols-4 gap-3">
    {/* 输入框（不带 label，用 placeholder 表达含义） */}
    <Input placeholder="名称" style={{ width: "100%" }} value={kw} onChange={setKw} onPressEnter={onSearch} />
    {/* 多选搜索 */}
    <Select mode="multiple" placeholder="分类" style={{ width: "100%" }} value={categories} onChange={setCategories}>
      {CATEGORY_OPTIONS.map((item) => (
        <Select.Option key={item} value={item}>
          {item}
        </Select.Option>
      ))}
    </Select>
    {/* 时间选择器（onChange 的第一个参数就是日期字符串数组） */}
    <DatePicker.RangePicker
      format="YYYY-MM-DD"
      style={{ width: "100%" }}
      placeholder={["创建开始", "创建结束"]}
      value={createdRange}
      onChange={setCreatedRange}
    />
    {/* 树形选择 */}
    <TreeSelect
      allowClear
      treeData={DEPARTMENT_TREE}
      placeholder="所属部门"
      style={{ width: "100%" }}
      value={dept}
      onChange={setDept}
    />
    {/* 远程搜索：showSearch 开启输入，filterOption={false} 关掉本地过滤，候选由 onSearch 的请求返回 */}
    <Select
      showSearch
      allowClear
      filterOption={false}
      loading={remoteLoading}
      placeholder="关联商品"
      style={{ width: "100%" }}
      value={product}
      onChange={setProduct}
      onSearch={setRemoteKeyword}
    >
      {remoteOptions.map((item) => (
        <Select.Option key={item} value={item}>
          {item}
        </Select.Option>
      ))}
    </Select>
    {/* 多选框、更多输入框……按需继续往网格里加 */}
    {/* 搜索 / 重置不另起一行：col-start-4 = 落在第 4 列——最后一行没填满时与最后一个条件同行贴最右，
        刚好填满时自动落到下一行最右 */}
    <div className="col-start-4 flex items-center justify-end gap-2">
      <Tooltip content="搜索">
        <Button type="primary" icon={<IconSearch />} onClick={onSearch} />
      </Tooltip>
      <Tooltip content="重置">
        <Button icon={<IconRefresh />} onClick={onReset} />
      </Tooltip>
    </div>
  </div>

  {/* 3. 操作行 - 左侧分类切换（页面级小 tab，可选；写法见第三节「页面级小 tab」），右侧靠最右是「新增」。
      列表选中数据后，「新增」前多出「导出 / 批量删除」；未选中时这两个按钮不显示。无卡片容器 */}
  <div className="flex items-center gap-2">
    <Tabs type="capsule" size="small" className="w-fit shrink-0" activeTab={category} onChange={onCategoryChange}>
      <Tabs.TabPane key="all" title="全部" />
      <Tabs.TabPane key="商品" title="商品" />
      <Tabs.TabPane key="订单" title="订单" />
    </Tabs>
    <div className="ml-auto flex items-center gap-2">
      {selectedKeys.length > 0 && (
        <>
          <Popconfirm className="w-56" title={`确认导出选中的 ${selectedKeys.length} 项？`} onOk={onExport}>
            <Tooltip content="导出">
              <Button icon={<IconDownload />} />
            </Tooltip>
          </Popconfirm>
          <Popconfirm className="w-56" title={`确认删除选中的 ${selectedKeys.length} 项？`} onOk={onBulkDelete}>
            <Tooltip content="批量删除">
              <Button status="danger" icon={<IconDelete />} />
            </Tooltip>
          </Popconfirm>
        </>
      )}
      <Tooltip content="新增">
        <Button icon={<IconPlus />} onClick={onCreate} />
      </Tooltip>
    </div>
  </div>

  {/* 4. 列表区 - 多选表格，无卡片容器 */}
  <div>
    <Table columns={columns} data={data} rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }} />
    <div className="mt-4 flex justify-end">
      <Pagination
        showTotal={(count) => `共 ${count} 条`}
        total={total}
        current={current}
        pageSize={pageSize}
        sizeCanChange
        sizeOptions={[10, 20, 50, 100]}
        onChange={(p, size) => {
          setCurrent(p);
          setPageSize(size);
        }}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrent(1);
        }}
      />
    </div>
  </div>

  {/* 5. 新增 / 编辑 / 详情共用右侧抽屉，只换标题与可编辑性（详情只读） */}
  <Drawer
    visible={drawerMode !== null}
    placement="right"
    width={480}
    title={DRAWER_TITLE[drawerMode]}
    footer={drawerMode === "detail" ? null : undefined}
    onOk={onSave}
    onCancel={closeDrawer}
  >
    {/* 表单字段见 apps/admin-web/src/pages/SampleListPage.tsx */}
  </Drawer>
</div>
```

> **筛选区与列表区都不要卡片容器**：不加 `bg-white` / `rounded-*` / `shadow-*` / `p-*`，直接落在页面背景上。
> 内容区本身已经有页面级留白（见第四节布局），再套一层卡片会多出边框感和双重内边距。
>
> **筛选条件**：一律用不带 label 的控件，靠 `placeholder` 表达含义（单选/多选这类没有 placeholder 的控件除外，
> 但优先考虑 `Radio.Group type="button"` 或把语义写进选项文案）。控制在四列网格里按需混用：输入框、单选、
> 多选搜索（`Select mode="multiple"`，自带输入搜索）、**远程搜索**（`Select showSearch` + `filterOption={false}`，
> 候选由 `onSearch` 请求返回，需自行防抖并处理竞态）、**树形选择**（`TreeSelect`）、时间选择器
> （`DatePicker.RangePicker`）。条件数不限。时间选择器的两个占位文案统一写成「<字段>开始 / <字段>结束」，
> 例如 `placeholder={["创建开始", "创建结束"]}`。
> 网格内的条件编辑在 `draft` 状态里，点「搜索」才提交为 `applied` 并触发查询；「重置」两者一起清空并回到第 1 页。
>
> **「搜索 / 重置」不单独占一行**：把它作为网格的最后一个子元素，加 `col-start-<末列号>`（4 列即 `col-start-4`），
> 它就会固定落在最后一列——最后一行没填满时与最后一个条件同行、贴该行最右；刚好被填满时自动落到下一行最右。
> 这样条件增删都不用改布局。
>
> **分页**：用独立 `Pagination`（不挂在 Table 的 `pagination` 属性上），必须做三件事——展示总数
> （`showTotal` → `共 N 条`）、可切页、可切换每页条数（`sizeCanChange` + `sizeOptions`，如 `[10, 20, 50, 100]`）。
> 切换每页条数后回到第 1 页。每页条数本身是 state，重新请求列表时要把它带给接口。
>
> **操作行**：筛选区下面、列表区上面单独一行。左侧是**页面级小 tab**（可选，用来切换分类 / 视图；
> 写法与约定见第三节「页面级小 tab」——`Tabs type="capsule"` + `size="small"` + `w-fit`；不参与「搜索」提交，
> 改动立即生效并回到第 1 页）。该维度不要在两处都放：分类由 tab 承担，筛选网格里就不要再放分类条件。
> 这一行右侧靠最右固定放「新增」。
> 列表支持多选后，**选中数据时**在「新增」左前方出现「导出 / 批量删除」，未选中时这两个按钮不显示、也不占位。
> 批量删除走 `Popconfirm` 二次确认；批量按钮的 Tooltip 带上选中数量。
>
> **所有批量操作都要二次确认**（含导出）：凡是一次影响多行的按钮，一律包 `Popconfirm`，
> 确认文案**写成一行**并把影响范围写进去，例如 `确认删除选中的 3 项？`；不要拆成标题 + `content` 两行。
>
> **`Popconfirm` 挂在 icon 按钮上时要给定宽**：它的弹层宽度由标题文字撑开，而 icon 按钮触发的弹层很窄，
> 文案和「取消 / 确定」都会被挤到换行堆叠。统一加 `className="w-56"`（Tailwind 标准宽度 14rem = 224px），
> 保证文案一行、按钮一行；如果文案更长，按需升到 `w-64` 并保持单行。
>
> **新增 / 编辑 / 详情**共用同一个右侧抽屉（`Drawer placement="right"`，宽度 480），只换标题与可编辑性：
> 详情只读（`footer={null}` + 控件 `disabled`），新增与编辑可编辑。行操作固定为
> 详情（小眼睛 `IconEye`）/ 编辑 / 删除 三个 icon 按钮。
>
> **按钮强调色**：一组按钮里只保留一个 `type="primary"`（筛选区的「搜索」），其余用默认样式；
> 破坏性操作用 `status="danger"`（删除、批量删除）。
>
> 完整示例（网格内 10 个条件，覆盖输入框 / 多选搜索 / 远程搜索 / 树形选择 / 时间选择器 5 类控件，另有页面级 tab
> 分类切换、多选批量操作与右侧抽屉，含可用的过滤逻辑）见 `apps/admin-web/src/pages/SampleListPage.tsx`。

### 列表字段规范

1. **超长文本截断**：超过 12 个字符使用 `...` 展示，悬浮显示全部内容
2. **列表操作列**：固定在右侧，使用 icon 按钮，悬浮显示操作名称
3. **列多时横向滚动 + 两端固定**：列总宽超过容器就用 `scroll={{ x: <列宽合计> }}` 横向滚动，并固定两端——
   左端固定标识列（本模板固定「编码」），右端固定操作列；多选列也要一起固定（`rowSelection={{ fixed: true }}`）。
   **固定列必须排在列的首尾**：左侧固定列只能是列表最前面那几列，所以要把要固定的列挪到第一列，
   不能只挑中间的列加 `fixed: "left"`，否则悬浮位置会错乱。
   **滚动条常显样式统一放在各端 `src/index.css`**（`apps/admin-web/src/index.css` 已加）：macOS 默认隐藏浮层滚动条，
   鼠标用户既看不到横向滚动条、也拖不动，宽表格后面的列就"够不到"——所以必须显式给
   `.arco-table-content-inner` 补 `overflow-x: auto` 与 `::-webkit-scrollbar` 样式，不要每个页面各写一遍。

```tsx
// 列表字段配置示例
const columns = [
  // 左侧固定列必须排在最前
  { title: "编码", dataIndex: "code", fixed: "left", width: 160 },
  {
    title: "名称",
    dataIndex: "name",
    width: 220,
    render: (text) => (
      <Tooltip content={text}>
        <span className="block max-w-[200px] truncate">{text}</span>
      </Tooltip>
    ),
  },
  // ……中间是普通列
  {
    title: "操作",
    dataIndex: "actions",
    fixed: "right",
    width: 140,
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

// 配合 scroll + 固定多选列，两端滚动时始终可见
<Table
  columns={columns}
  data={data}
  scroll={{ x: 2380 }}
  rowSelection={{ fixed: true, selectedRowKeys, onChange: setSelectedRowKeys }}
/>;
```

## 六、加载态规范

按「加载的是整页还是局部」分两种，不要混用：

### 列表页 —— 用 Spin 指示符，不用骨架屏

页面外壳（标题区 / 筛选区 / 操作行）**一进来就直接渲染**，不给骨架屏；列表区加 `Spin dot` 指示符。
查询、重置、翻页、新增 / 编辑保存后重新请求列表，全都走这一个 Spin：

```tsx
import { Spin } from "@arco-design/web-react";

// loading 初值为 true：首次进入也走 Spin，不显示骨架屏
// block 必加：.arco-spin 是 display:inline-block，会按内容宽度收缩，宽表格会被撑出页面、内部横向滚动失效
<Spin loading={loading} dot block>
  <Table columns={columns} data={data} />
</Spin>;
```

### 抽屉 / 详情 —— 用骨架屏

局部内容（详情抽屉、面板等）取数期间用 `Skeleton` 占位，取回后替换为只读展示：

```tsx
{
  detailLoading ? (
    <Skeleton text={{ rows: 2 }} />
  ) : (
    <Descriptions column={1} data={[{ label: "名称", value: detailData.name }]} />
  );
}
```

### Mobile 端

移动端卡片列表沿用卡片骨架屏：

```tsx
import { Skeleton } from "@arco-design/mobile-react";

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton title paragraph={{ rows: 1 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg bg-white p-4">
          <Skeleton title paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
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

| #   | 规则                                                                                                                                                            | 校验实现                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | 页面组件必须 `PascalCase + Page.tsx`（`pages/` 下）                                                                                                             | `check_page_naming`                                            |
| 2   | UI 库与应用类型严格匹配，禁止跨端导入                                                                                                                           | `check_ui_library_cross_import`                                |
| 3   | 禁止内联 style（Arco 必要属性如 `width` / `height` 除外）                                                                                                       | `check_inline_style`                                           |
| 4   | 禁止硬编码颜色值（引号内 HEX），用 Tailwind 调色板                                                                                                              | `check_hardcoded_colors`                                       |
| 5   | 操作反馈用对组件（web `Notification` / mobile `Notify`）                                                                                                        | `check_notification_component`                                 |
| 6   | 加载态必须有指示：列表用 `Spin dot`，抽屉 / 局部用 `Skeleton`（见第六节）                                                                                       | `check_skeleton_loading`（与现行约定不一致且漏报，见下方说明） |
| 7   | 图片上传必须用公共组件 `ImageUpload`（禁止裸 `Upload` / `input type=file`，admin-web）                                                                          | `check_image_upload_component`                                 |
| 8   | 禁止 CSS Modules / styled-components / emotion / 业务自建 `.css`，样式统一 Tailwind（各端仅一个入口 `index.css`；预览入口 `apps/*/preview/index.css` 同样合规） | `check_style_solution`                                         |
| 9   | 设计 token 单一来源：各端 `tailwind.config` 只能 `content` + `presets`，禁止自带 `theme` / `plugins`                                                            | `check_tailwind_single_source`                                 |

> **第 6 条已与现行约定脱节，勿依赖**：`check_skeleton_loading` 要求「有 loading 就必须出现 `Skeleton`」，
> 但第六节约定列表页用 `Spin dot`、骨架屏只用于抽屉/局部；而且它的正则 `useState.*loading` 要求 `useState`
> 出现在 `loading` 之前，对 `const [loading, setLoading] = useState(false)` 这种常见写法根本匹配不上，
> 长期处于漏报状态。修正检测需要同时改判定口径，目前按人工评审处理。

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
- 列表页布局：页面标题区 → 筛选区（条件网格，搜索 / 重置 贴最后一项那一行的最右）→ 操作行（左侧状态切换，右侧最右为
  「新增」；列表选中后在「新增」前出现「导出 / 批量删除」）→ 多选列表区。新增 / 编辑 / 详情统一走右侧抽屉。
- 列表操作列固定在右侧，使用 icon 按钮 + `Tooltip` 显示操作名称。
- 批量操作（含导出）必须二次确认：凡一次影响多行的按钮都包 `Popconfirm`，确认文案写明影响范围。
- 列表字段超长文本（超过 12 个字符）截断并悬浮显示全文。
- 加载态：**必须人工确认**。列表页用 `Spin dot`、且首次进入也不给骨架屏；骨架屏只用于抽屉 / 局部内容
  （第六节）。第 6 条的自动检测与现行约定不一致且漏报，见 8.1 说明。
- 响应式约定：Web 端固定桌面布局；Mobile 端使用 `dvh` / `fixed` 定位 / 触摸友好尺寸。

### 8.4 存量偏离清单（待迁移，新增代码不得模仿）

| 项目       | 现状                                                   | 目标                                        |
| ---------- | ------------------------------------------------------ | ------------------------------------------- |
| 骨架屏     | 21/28 页面缺失，普遍用 `Table loading` 替代            | 整页骨架屏（`MdDocsPage.tsx` 已落地）       |
| 列表页结构 | 搜索框普遍放在标题行，无独立筛选区，按钮位置不统一     | 按第五节三段式结构（筛选区/列表区不套卡片） |
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
