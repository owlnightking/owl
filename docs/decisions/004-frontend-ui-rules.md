# 004-frontend-ui-rules — 前端 UI 规则 Harness

## 日期

2026-09-08

## 背景

前端 UI 布局混乱，AI Agent 编写前端代码时缺乏统一规范，导致：

- 组件命名不一致
- UI 库跨端导入
- 样式混用（Tailwind + 内联 style + CSS Modules）
- 硬编码颜色值散落

## 决策

创建 `docs/frontend-rules.md` 前端 UI 规范文件，配合 `scripts/check-frontend-rules.sh` 检查脚本，实现：

1. AI Agent 编写前端代码前必须读取规范
2. 编写后运行 `pnpm frontend:check` 验证
3. ERROR 级别问题阻断提交

## 后果

- **正面**：统一前端代码风格，减少 AI 乱写
- **负面**：增加 AI Agent 和开发者的认知负担
- **缓解**：规则文件简洁明了，检查脚本自动执行

## 关联

- `docs/frontend-rules.md`
- `scripts/check-frontend-rules.sh`
- `AGENTS.md` 第十二节
