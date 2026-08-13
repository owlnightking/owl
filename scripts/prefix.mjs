#!/usr/bin/env node
// prefix.mjs — 为每个 dev 服务输出加彩色前缀标签，并过滤 ANSI 清屏序列，
// 避免 Nest watch 的 \x1b[2J\x1b[3J\x1b[H 抹掉其他服务（如 vite）已打印的日志。
// 用法: <cmd> | node scripts/prefix.mjs <label> <color>

import readline from "node:readline";

const [label = "", color = "36"] = process.argv.slice(2);
const prefix = `\x1b[${color}[${label}]\x1b[0m `;

const strip = (chunk) =>
  chunk.replace(/\x1b\[\d*;?\d*[HJ]|\x1b\[2J|\x1b\[3J|\x1b\[[0-9;]*H|\x1b\[\d+A|\x1b\[\d+B|\x1b\[\d+C|\x1b\[\d+D/g, "");

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", (line) => {
  const cleaned = strip(line);
  if (cleaned.trim() !== "") process.stdout.write(prefix + cleaned + "\n");
});

rl.on("close", () => process.exit(0));
