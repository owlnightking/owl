# 005-frontend-rules-warn-blocking — 前端 UI 检查全量阻断

## 日期

2026-09-15

## 背景

`scripts/check-frontend-rules.sh` 原将「内联 style / 硬编码颜色 / 缺少骨架屏」定为 WARN，仅在 `ERROR_COUNT > 0` 时 `exit 1`，因此这类问题即使存在也不阻断提交（ADR 004 的设计）。实际提交中出现 14 条 WARN 仍顺利通过，规则形同提示，无法约束 AI Agent 与开发者。

## 决策

将原 WARN 级别的检查项（内联 style、硬编码颜色值、页面有 loading 但缺 Skeleton）全部升级为 ERROR：

1. `check-frontend-rules.sh` 移除 WARN 计数与 `warn()`，相关检查改调 `error()`，存在任一问题即 `exit 1`
2. `AGENTS.md` 第十二节「阻断规则」合并为统一 ERROR 清单
3. `docs/frontend-rules.md` 第八节注明检出即阻断

存量代码的 14 处问题本次不修，按「规则先行、代码后续」推进；在修复前 `pnpm frontend:check` 与 `pnpm verify:quick` 将失败，属预期。

## 后果

- **正面**：规则具备强制力，前端样式问题无法再绕过门禁
- **负面**：存量 14 处问题立即变红，需另行排期修复，期间提交被阻断
- **缓解**：修复任务独立跟进，修复后 `verify:quick` 恢复全绿

## 关联

- `docs/decisions/004-frontend-ui-rules.md`（本决策修订其 WARN 策略）
- `scripts/check-frontend-rules.sh`
- `docs/frontend-rules.md`
- `AGENTS.md` 第十二节
