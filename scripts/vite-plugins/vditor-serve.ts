import { Plugin } from "vite";
import { dirname, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
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

  return {
    name: "vditor-serve",
    configResolved(config) {
      vditorRoot = findVditorRoot(config.root);
      if (!vditorRoot) {
        console.warn("[vditor-serve] cannot resolve vditor in node_modules");
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith(VDITOR_PREFIX) || !vditorRoot) {
          return next();
        }
        const relativePath = req.url.slice(VDITOR_PREFIX.length);
        const filePath = resolve(vditorRoot, relativePath);

        if (!existsSync(filePath)) {
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
  };
}
