#!/bin/bash
set -e

REPO_URL="https://github.com/YOUR_ORG/owl"
RUNNER_NAME="owl-local-runner"
RUNNER_LABELS="self-hosted,linux,x64,owl"

cd "$(dirname "$0")"

echo "=== GitHub Actions Self-Hosted Runner 配置 ==="
echo ""
echo "1. 先在 GitHub 仓库 Settings > Actions > Runners 创建 runner"
echo "2. 获取 registration token"
echo ""
read -p "请输入 registration token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "token 不能为空"
    exit 1
fi

./config.sh --url "$REPO_URL" --token "$TOKEN" --name "$RUNNER_NAME" --labels "$RUNNER_LABELS" --work _work

echo ""
echo "=== 配置完成 ==="
echo "启动 runner: ./run.sh"
echo "或注册为服务: sudo ./svc.sh install && sudo ./svc.sh start"
