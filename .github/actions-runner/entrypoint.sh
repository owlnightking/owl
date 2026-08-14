#!/bin/bash
set -e

cd /runner

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
  --unattended

# 启动 Runner
./run.sh
