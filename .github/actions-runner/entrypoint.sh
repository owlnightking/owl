#!/bin/bash
set -e

cd /home/runner

# 修复 Docker socket 权限（每次启动都执行）
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# 创建 wrapper 脚本确保每个 job 都有正确权限
sudo tee /usr/local/bin/docker-wrapper > /dev/null <<'EOF'
#!/bin/bash
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
exec /usr/bin/docker "$@"
EOF
sudo chmod +x /usr/local/bin/docker-wrapper

# 如果 runner 已配置（.runner 文件存在），直接启动
if [ -f .runner ]; then
  echo "Runner already configured, starting directly..."
  ./run.sh
  exit $?
fi

# 获取注册 Token
REG_TOKEN=$(curl -s -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${ORG_NAME}/${REPO_NAME}/actions/runners/registration-token" | jq -r '.token')

# 配置 Runner
./config.sh \
  --url "https://github.com/${ORG_NAME}/${REPO_NAME}" \
  --token "${REG_TOKEN}" \
  --name "${RUNNER_NAME:-docker-runner}" \
  --labels "${RUNNER_LABELS:-self-hosted,linux,x64,docker}" \
  --work "_work" \
  --replace \
  --unattended

# 启动 Runner
./run.sh
