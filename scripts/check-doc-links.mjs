#!/usr/bin/env node
// check-doc-links.mjs — 文档本地引用死链检查
//
// 用法: node scripts/check-doc-links.mjs
// 范围: docs/**/*.md、scripts/**/*.md、根级 README.md / AGENTS.md
// 校验: Markdown 内联链接 + 反引号中的仓库路径（docs/ scripts/ .github/ k8s/ tailwind/ 与根级已知文件）
//
// 为什么只查这几类路径：ADR 会引用「规划中」的源码路径（如待建的 packages/permission/src/permissions.ts），
// 校验它们会把正常的规划文档判为死链。文档互引、脚本路径、根级入口才是必须真实存在的。
//
// 跳过: URL / 锚点 / 含 * < > { } 的 glob 与占位符。
// 输出: <file>:<line>: <target>（每处一行）；有死链 exit 1，否则 exit 0。

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SCAN_DIRS = ["docs", "scripts"];
const ROOT_DOCS = ["README.md", "AGENTS.md"];
const PATH_PREFIXES = ["docs/", "scripts/", ".github/", "k8s/", "tailwind/"];
const ROOT_FILES = new Set([
  "README.md",
  "AGENTS.md",
  "package.json",
  "docker-compose.yml",
  ".sops.yaml",
  "pnpm-workspace.yaml",
]);

const GLOB_CHARS = /[*<>{}]/;
const TRAILING_PUNCTUATION = /[.,;:!?，。；：、）)\]]+$/;

function walkMarkdown(dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkMarkdown(full, out);
    } else if (name.endsWith(".md")) {
      out.push(full);
    }
  }
}

function collectFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) walkMarkdown(join(ROOT, dir), files);
  for (const doc of ROOT_DOCS) {
    const full = join(ROOT, doc);
    if (existsSync(full)) files.push(full);
  }
  return files;
}

function normalizeTarget(raw) {
  let target = raw.trim();
  if (!target) return null;
  if (/^(https?:|mailto:|tel:|#)/i.test(target)) return null;
  target = target.replace(/^<|>$/g, "");
  target = target.replace(/#.*$/, "");
  target = target.replace(/:\d+$/, "");
  target = target.replace(TRAILING_PUNCTUATION, "");
  if (!target || GLOB_CHARS.test(target)) return null;
  if (target.startsWith("/")) target = target.slice(1);
  return target;
}

/** 精确路径不存在时，允许 docs/decisions/002 这类编号简写指向 002-*.md */
function resolveWithPrefix(base) {
  if (existsSync(base)) return true;
  const dir = dirname(base);
  const name = base.slice(dir.length + 1);
  if (!existsSync(dir) || !name) return false;
  return readdirSync(dir).some((entry) => entry.startsWith(`${name}-`) || entry.startsWith(`${name}.`));
}

function isKnownPath(target) {
  return PATH_PREFIXES.some((prefix) => target.startsWith(prefix)) || ROOT_FILES.has(target);
}

function checkTarget(target, fromFile) {
  const candidates = [];
  if (target.startsWith("./") || target.startsWith("../")) {
    candidates.push(resolve(dirname(fromFile), target));
  } else if (isKnownPath(target)) {
    candidates.push(resolve(ROOT, target));
    candidates.push(resolve(dirname(fromFile), target));
  } else {
    candidates.push(resolve(dirname(fromFile), target));
    candidates.push(resolve(ROOT, target));
  }
  return candidates.some((candidate) => resolveWithPrefix(candidate));
}

/** gitignore 中的文件按设计不在仓库内（如明文 Secret），不算死链 */
function isIgnoredByGit(target, fromFile) {
  const candidates = [resolve(ROOT, target), resolve(dirname(fromFile), target)];
  return candidates.some((candidate) => {
    const result = spawnSync("git", ["check-ignore", "-q", candidate], { cwd: ROOT });
    return result.status === 0;
  });
}

function findInlineLinks(line) {
  const targets = [];
  const regex = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = regex.exec(line)) !== null) targets.push(match[1]);
  return targets;
}

/** 反引号内容按空白切词，逐个判断是否像仓库路径；`bash scripts/x.sh` 也能命中 */
function findBacktickPaths(line) {
  const targets = [];
  const regex = /`([^`\n]+)`/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    for (const word of match[1].split(/\s+/)) {
      const target = normalizeTarget(word);
      if (target && isKnownPath(target)) targets.push(target);
    }
  }
  return targets;
}

const files = collectFiles();
const failures = [];

for (const file of files) {
  const relativeFile = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const targets = [...findInlineLinks(line), ...findBacktickPaths(line)];
    for (const raw of targets) {
      const target = normalizeTarget(raw);
      if (!target) continue;
      if (!checkTarget(target, file) && !isIgnoredByGit(target, file)) {
        failures.push(`${relativeFile}:${index + 1}: ${target}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(`check-doc-links.mjs: 发现 ${failures.length} 处失效引用`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`check-doc-links.mjs: OK（${files.length} 个文档）`);
