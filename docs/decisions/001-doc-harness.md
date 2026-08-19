# 001: 引入文档新鲜度 Harness（PROJECT_STATE + 决策日志）

- 日期：2026-08-19
- 背景：每次迭代后 AI 都要重新扫描全仓才能拼出现状，token 成本高；纯手写文档随迭代漂移，后期没人信文档
- 决策：三层文档结构 ——
  1. `docs/PROJECT_STATE.md`：单文件状态快照，`### 自动 ###` 段由 `scripts/update-state.sh` 扫描源码生成（脚本管事实，人管"为什么"）
  2. `docs/decisions/NNN-*.md`：ADR-lite 决策日志，只追加不修改
  3. `AGENTS.md` / `README.md`：稳定规则层，低频更新
     防漂移由 `scripts/check-doc-freshness.sh` 强制：pre-commit 检查暂存区，verify:quick/CI 比较源码与文档最近提交时间；版本 bump（仅 package.json）豁免
- 后果：
  - AI 开工只需读 1 个 ≤150 行的状态文件，token 显著下降
  - 文档新鲜度进门禁，漂移在 commit/CI 阶段即被拦截
  - 代价：每次改代码需同 commit 更新状态文档（脚本自动重生成，人工只补说明列）
- 关联：`AGENTS.md` 第八节、`scripts/update-state.sh`、`scripts/check-doc-freshness.sh`
