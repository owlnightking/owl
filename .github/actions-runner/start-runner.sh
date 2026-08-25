#!/bin/bash
set -e

# 安装 docker.io
sudo apt-get update
sudo apt-get install -y docker.io

# 添加 runner 用户到 docker 组
sudo usermod -aG docker runner

# 修改 docker.sock 权限
sudo chown runner:docker /var/run/docker.sock

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
