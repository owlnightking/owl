import { Plugin } from "vite";
import { dirname, resolve } from "node:path";
import { existsSync, readFileSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";

const VDITOR_PREFIX = "/vditor/";
const CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function findVditorRoot(root: string): string {
  const candidates = [
    resolve(root, "node_modules/vditor"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../node_modules/vditor"),
  ];
  for (const candidate of candidates) {
    if (existsSync(resolve(candidate, "dist"))) return candidate;
  }
  return "";
}

const MIME_MAP: Record<string, string> = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
};

export function vditorPlugin(): Plugin {
  let vditorRoot = "";
  let basePath = "/";
  let outDir = "";
  let outDirResolved = "";

  return {
    name: "vditor-serve",
    configResolved(config) {
      vditorRoot = findVditorRoot(config.root);
      if (!vditorRoot) {
        console.warn("[vditor-serve] cannot resolve vditor in node_modules");
      }
      const base = config.base || "/";
      basePath = base.endsWith("/") ? base : `${base}/`;
      outDir = config.build.outDir;
      outDirResolved = resolve(config.root, outDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!vditorRoot) return next();
        const pathname = (req.url || "").split("?")[0];
        const prefixes = [`${basePath}vditor/`, VDITOR_PREFIX];
        const prefix = prefixes.find((p) => pathname.startsWith(p));
        if (!prefix) return next();

        const relativePath = pathname.slice(prefix.length);
        const filePath = resolve(vditorRoot, relativePath);
        if (!filePath.startsWith(vditorRoot) || !existsSync(filePath)) {
          return next();
        }

        const lastDot = filePath.lastIndexOf(".");
        const ext = lastDot >= 0 ? filePath.slice(lastDot) : "";
        const mime = MIME_MAP[ext] ?? "application/octet-stream";

        res.setHeader("Content-Type", mime);
        res.setHeader("Cache-Control", `public, max-age=${CACHE_MAX_AGE_SECONDS}, immutable`);
        res.end(readFileSync(filePath));
      });
    },
    closeBundle() {
      if (!vditorRoot || !outDirResolved) return;
      const sourceDir = resolve(vditorRoot, "dist");
      const targetDir = resolve(outDirResolved, "vditor", "dist");
      if (!existsSync(sourceDir)) return;
      cpSync(sourceDir, targetDir, {
        recursive: true,
        filter: (src) => {
          const relative = src.slice(sourceDir.length + 1);
          if (!relative) return true;
          if (relative === "ts" || relative === "types") return false;
          if (relative.startsWith("ts/") || relative.startsWith("types/")) return false;
          return !relative.endsWith(".d.ts");
        },
      });
    },
  };
}
