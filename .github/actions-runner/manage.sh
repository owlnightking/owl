#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=== GitHub Actions Runner 管理 ==="
echo ""
echo "1) 启动"
echo "2) 停止"
echo "3) 重启"
echo "4) 日志"
echo "5) 状态"
echo ""
read -p "选择操作 [1-5]: " choice

case $choice in
    1)
        docker compose up -d
        echo "Runner 已启动"
        ;;
    2)
        docker compose down
        echo "Runner 已停止"
        ;;
    3)
        docker compose restart
        echo "Runner 已重启"
        ;;
    4)
        docker compose logs -f
        ;;
    5)
        docker compose ps
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac
