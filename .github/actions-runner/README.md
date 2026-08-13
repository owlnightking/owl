# GitHub Actions Self-Hosted Runner

## 快速开始

1. 创建 GitHub Personal Access Token
   - Settings > Developer settings > Personal access tokens
   - 权限: `repo`, `admin:org`

2. 配置环境变量

   ```bash
   cp .env.example .env
   # 编辑 .env，填入 ACCESS_TOKEN、ORG_NAME、REPO_NAME
   ```

3. 启动 Runner

   ```bash
   ./manage.sh
   # 选择 1) 启动
   ```

4. 验证
   - GitHub 仓库 > Settings > Actions > Runners
   - 应能看到 `owl-runner` 状态为 `Idle`

## 文件说明

- `Dockerfile` - Runner 镜像
- `docker-compose.yml` - 容器编排
- `.env` - 环境变量配置
- `manage.sh` - 管理脚本

## 注意事项

- Runner 容器挂载了 Docker socket，可以直接构建镜像
- 首次启动会自动注册，重启不会重复注册
- Token 泄露后立即在 GitHub 重新生成
