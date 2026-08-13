# 本地 CD 配置说明

## 架构

```
本地代码 → GitHub → 本地 Runner → 本地 Registry → K3s → 飞书通知
```

## 已配置组件

| 组件            | 状态      | 说明                     |
| --------------- | --------- | ------------------------ |
| K3s 集群        | ✅ 运行中 | localhost:6443           |
| Docker Registry | ✅ 运行中 | localhost:5001           |
| GitHub Runner   | 待启动    | .github/actions-runner/  |
| CD 流水线       | ✅ 已配置 | .github/workflows/cd.yml |

## GitHub Secrets 配置

在仓库 Settings > Secrets and variables > Actions 添加：

```
K3S_KUBECONFIG  # cat ~/.kube/config | base64 | tr -d '\n'
FEISHU_WEBHOOK  # 飞书机器人 Webhook 地址
```

## 启动 Runner

```bash
cd .github/actions-runner

# 编辑 .env，填入 GitHub Token
vim .env

# 启动
docker compose up -d

# 查看日志
docker compose logs -f
```

## 验证

1. **Registry**

   ```bash
   curl http://localhost:5001/v2/_catalog
   ```

2. **K3s**

   ```bash
   kubectl get nodes
   kubectl get pods -n owl
   ```

3. **Runner**
   - GitHub 仓库 > Settings > Actions > Runners
   - 应显示 `owl-runner` 状态为 `Idle`

## 流程

1. 代码推送到 `main` 分支
2. Runner 检查版本是否升级
3. 运行 `pnpm verify:quick` (lint + typecheck)
4. 并行构建 5 个镜像
5. 推送到本地 Registry
6. 部署到 K3s
7. 飞书通知结果
