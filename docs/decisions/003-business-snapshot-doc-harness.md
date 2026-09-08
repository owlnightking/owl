# 003: 引入业务快照 business-snapshot.md 并接入文档 Harness

- 日期：2026-09-07
- 背景：`docs/PROJECT_STATE.md` 是**工程状态快照**（自动段扫描源码），AI 靠它拿源码全局；但业务侧"功能现状 + 最新计划"是持续增长、且多在未落代码阶段（S0/S1…/B1），源码扫不出来。若塞进 PROJECT_STATE 会撑爆快照且失去门禁保护。需要一个专门给 AI 读的**业务快照**。
- 决策：
  1. 新增 `docs/business-snapshot.md`，专记**业务功能现状（规则/角色/入口/状态）+ 最新计划/排期 + 待决事项**，随业务需求/计划变化更新（不随源码），人工维护功能内容。
  2. 接入 harness，与 PROJECT_STATE 同构（update + check 双脚本）：
     - `scripts/update-business-snapshot.sh`（pnpm `business:update "摘要"`）：维护「最近更新」自动段（禁止手改）+ prettier
     - `scripts/check-business-freshness.sh`（pnpm `business:check`）：业务快照的"事实来源" = `implementation-plan.md` + `docs/decisions/`；来源更新而快照未同步 → ERROR
     - 并入 `verify:quick` 与 `.husky/pre-commit`（`--staged` 增量）；CI/pre-push 经 verify:quick 覆盖；无需改动 cd.yml
     - 业务快照不与源码做新鲜度绑定（源码变化由 PROJECT_STATE 负责），只与"计划/决策"绑定
  3. 文档分层由三层扩为四层：工程状态快照 / 业务快照 / 决策日志 / 稳定规则与计划层；AGENTS.md 第八节、第一节命令、第四节脚本表、第七节变更流程同步更新
- 后果：
  - AI 开工读 PROJECT_STATE（工程）+ business-snapshot（业务）即拿全局，业务排期与功能现状不再散落对话与各文档
  - 改 implementation-plan / decisions 而不更新业务快照会被 pre-commit / verify 阻断（提示 `pnpm business:update`）
  - 业务快照为人工内容，防漂移靠"计划/决策门禁"，不保证业务与源码一一对应（源码侧仍由 PROJECT_STATE 兜底）
- 关联：`docs/business-snapshot.md`、`scripts/update-business-snapshot.sh`、`scripts/check-business-freshness.sh`、`AGENTS.md` 第八节、`docs/PROJECT_STATE.md`（工程快照）
