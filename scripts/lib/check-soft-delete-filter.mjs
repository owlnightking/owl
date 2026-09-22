#!/usr/bin/env node
// check-soft-delete-filter.mjs — 仓储层软删除过滤检查（被 check-backend-rules.sh 复用）
//
// 用法: node scripts/lib/check-soft-delete-filter.mjs <file...>
// 输出: <file>:<行号>:<方法名> 缺少 deletedAt 过滤，每处一行；无问题则无输出；退出码恒为 0。
//
// 检查范围：列表与统计类读查询（findMany / findFirst / count / aggregate / groupBy）。
// 不检查 findUnique / findUniqueOrThrow —— 软删除记录的「恢复/重建」upsert 流程必须能查到已删除行
// （如 `findUnique({ where: { code } })` 后把 deletedAt 置空），这类访问是合法例外。
//
// 支持 `const where = { ..., deletedAt: null }` 后 `findMany({ where })` 的常见写法：
// 会把 where 的引用解析回同文件的 const 声明再判断，避免把正确代码误判为违规。

import { readFileSync } from "node:fs";

const READ_METHODS = ["findMany", "findFirst", "count", "aggregate", "groupBy"];
const MAX_RESOLVE_DEPTH = 8;

function readBalanced(content, start, open, close) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (quote) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  return null;
}

// 从标识符之后跳到赋值 `=`，跳过 `const where: Record<string, unknown> = ...` 里的类型注解。
// 需要跳过 `=>`、`==`、`>=`、`<=` 等运算符里的等号，并跟踪泛型/括号嵌套。
function skipToAssignment(content, from) {
  let depth = 0;
  for (let i = from; i < content.length; i++) {
    const ch = content[i];
    if (ch === "<" || ch === "(" || ch === "[" || ch === "{") {
      depth++;
      continue;
    }
    if (ch === ">" || ch === ")" || ch === "]" || ch === "}") {
      if (depth > 0) depth--;
      continue;
    }
    if (ch !== "=" || depth > 0) continue;
    const next = content[i + 1];
    const prev = content[i - 1];
    if (next === "=" || next === ">") continue;
    if ("!<>+-*/%&|^?".includes(next ?? "") || "!<>+-*/%&|^?".includes(prev ?? "")) continue;
    return i + 1;
  }
  return -1;
}

function collectConsts(content) {
  const consts = new Map();
  const re = /(?:const|let|var)\s+([A-Za-z0-9_$]+)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const valueStart = skipToAssignment(content, re.lastIndex);
    if (valueStart === -1) continue;
    const ch = content[valueStart];
    let text = null;
    if (ch === "{" || ch === "(" || ch === "[") {
      const pair = { "{": "}", "(": ")", "[": "]" }[ch];
      text = readBalanced(content, valueStart, ch, pair);
    }
    if (text === null) {
      const end = content.indexOf(";", valueStart);
      text = content.slice(valueStart, end === -1 ? content.length : end);
    }
    consts.set(match[1], text);
  }
  return consts;
}

function resolvesToSoftDeleteFilter(expr, consts, seen = new Set(), depth = 0) {
  if (!expr || depth > MAX_RESOLVE_DEPTH) return false;
  if (/\bdeletedAt\b/.test(expr)) return true;
  for (const identifier of expr.match(/[A-Za-z0-9_$]+/g) ?? []) {
    if (seen.has(identifier)) continue;
    const value = consts.get(identifier);
    if (value === undefined) continue;
    seen.add(identifier);
    if (resolvesToSoftDeleteFilter(value, consts, seen, depth + 1)) return true;
  }
  return false;
}

function lineIndex(content) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") starts.push(i + 1);
  }
  return (position) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= position) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

const findings = [];
for (const file of process.argv.slice(2)) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch (err) {
    process.stderr.write(`check-soft-delete-filter.mjs: 跳过无法读取的文件 ${file}: ${err.message}\n`);
    continue;
  }
  const consts = collectConsts(content);
  const lineOf = lineIndex(content);
  for (const method of READ_METHODS) {
    const re = new RegExp(`\\.${method}\\(`, "g");
    let match;
    while ((match = re.exec(content)) !== null) {
      const open = content.indexOf("(", match.index);
      const call = readBalanced(content, open, "(", ")");
      if (call === null) continue;
      if (!resolvesToSoftDeleteFilter(call, consts)) {
        findings.push(`${file}:${lineOf(match.index)}:${method} 缺少 deletedAt 过滤`);
      }
    }
  }
}

if (findings.length > 0) {
  process.stdout.write(`${findings.join("\n")}\n`);
}
