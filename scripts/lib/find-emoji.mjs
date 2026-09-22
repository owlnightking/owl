#!/usr/bin/env node
// find-emoji.mjs — emoji / 颜文字检测的唯一实现（被扫描脚本复用）
//
// 用法: node scripts/lib/find-emoji.mjs <file...>
// 输出: <file>:<行号>:<行内容>，每处匹配一行；无匹配则无输出；退出码恒为 0。
//
// 为什么不用 `grep -P`：macOS 自带 BSD grep 与 CI 用的 Alpine BusyBox grep 都不支持 -P，
// 该选项会直接报错，配合 2>/dev/null 会让整条检查静默失效。用 node（本项目 engines 要求 >=22）
// 才能在本地与 CI 得到一致结果。码位范围与原 PCRE 规则保持等价。

import { readFileSync } from "node:fs";

const EMOJI_PATTERN = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;

const matched = [];
for (const file of process.argv.slice(2)) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch (err) {
    process.stderr.write(`find-emoji.mjs: 跳过无法读取的文件 ${file}: ${err.message}\n`);
    continue;
  }
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index++) {
    if (EMOJI_PATTERN.test(lines[index])) {
      matched.push(`${file}:${index + 1}:${lines[index]}`);
    }
  }
}

if (matched.length > 0) {
  process.stdout.write(`${matched.join("\n")}\n`);
}
