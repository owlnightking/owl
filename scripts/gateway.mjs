#!/usr/bin/env node
// gateway.mjs — 前端统一入口（dev）：web 与 mobile 拆分到两个网关端口。
//   web    监听 WEB_GATEWAY_PORT：    /portal /owl /admin /cron 前缀，根路径 -> portal
//   mobile 监听 MOBILE_GATEWAY_PORT： /mobile 前缀，根路径 -> /mobile/
// 两个入口的 /api 均转发 api-service（SSO 同域 cookie 前提）。支持 websocket（vite HMR）。
// 用法: node scripts/gateway.mjs  端口与目标读自根 .env

import http from "node:http";
import net from "node:net";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const readEnvPort = (key, fallback) => {
  const line = readFileSync(resolve(ROOT, ".env"), "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  return line ? Number(line.split("=")[1].trim()) : fallback;
};

const WEB_GATEWAY_PORT = readEnvPort("WEB_GATEWAY_PORT", 5172);
const MOBILE_GATEWAY_PORT = readEnvPort("MOBILE_GATEWAY_PORT", 5173);
const OWL_WEB_PORT = readEnvPort("OWL_WEB_PORT", 5273);
const ADMIN_WEB_PORT = readEnvPort("ADMIN_WEB_PORT", 5274);
const CRON_WEB_PORT = readEnvPort("CRON_WEB_PORT", 5275);
const MOBILE_WEB_PORT = readEnvPort("MOBILE_WEB_PORT", 5276);
const PORTAL_WEB_PORT = readEnvPort("PORTAL_WEB_PORT", 5270);
const API_PORT = readEnvPort("API_PORT", 5100);
const CRON_PORT = readEnvPort("CRON_PORT", 5101);

const ROUTES = [
  // 精确前缀必须排在同名前缀之前（如 /cron/docs 先于 /cron），否则会被 SPA 兜底吃掉。
  { prefix: "/cron/docs-json", port: CRON_PORT, proxyExact: true },
  { prefix: "/cron/docs", port: CRON_PORT, proxyExact: true },
  // vditor 运行时资源（子应用按 BASE_URL 动态加载）：必须排在 /admin 之前，
  // 否则 /admin/vditor/* 会被 portal 的 SPA 兜底吃掉，返回 index.html 而非 JS。
  { prefix: "/admin/vditor", port: ADMIN_WEB_PORT },
  { prefix: "/vditor", port: ADMIN_WEB_PORT },
  { prefix: "/portal", port: PORTAL_WEB_PORT },
  { prefix: "/owl", port: PORTAL_WEB_PORT },
  { prefix: "/admin", port: PORTAL_WEB_PORT },
  { prefix: "/cron", port: PORTAL_WEB_PORT },
  { prefix: "/mobile", port: MOBILE_WEB_PORT },
];

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const cleanHeaders = (headers) => {
  const out = { ...headers, connection: "keep-alive" };
  for (const k of HOP_BY_HOP) delete out[k];
  return out;
};

const createGateway = ({ port, label, prefixes, root }) => {
  const findTarget = (url) => {
    const pathname = url.split("?")[0];
    for (const r of ROUTES) {
      if (!prefixes.includes(r.prefix)) continue;
      if (pathname === r.prefix) {
        return r.proxyExact ? { port: r.port, prefix: r.prefix } : { redirect: `${r.prefix}/` };
      }
      if (pathname.startsWith(`${r.prefix}/`)) return { port: r.port, prefix: r.prefix };
    }
    if (pathname.startsWith("/api")) {
      return { port: API_PORT, prefix: "/api" };
    }
    return root;
  };

  const server = http.createServer((req, res) => {
    const target = findTarget(req.url);
    if (target.redirect) {
      res.writeHead(302, { Location: target.redirect });
      res.end();
      return;
    }
    const proxy = http.request(
      {
        host: "127.0.0.1",
        port: target.port,
        method: req.method,
        path: req.url,
        headers: cleanHeaders(req.headers),
      },
      (pres) => {
        res.writeHead(pres.statusCode, pres.headers);
        pres.pipe(res);
      }
    );
    proxy.on("error", (err) => {
      console.error(`[gateway:${label}] ${target.prefix} -> :${target.port} error: ${err.message}`);
      res.writeHead(502, { "content-type": "text/plain" });
      res.end(`gateway upstream error for ${target.prefix}`);
    });
    req.pipe(proxy);
  });

  server.on("upgrade", (req, socket, head) => {
    const target = findTarget(req.url);
    if (target.redirect) {
      socket.end();
      return;
    }
    const upReq = [
      `GET ${req.url} HTTP/1.1`,
      "Host: 127.0.0.1:" + target.port,
      "Connection: Upgrade",
      "Upgrade: websocket",
      req.headers["sec-websocket-key"] ? `Sec-WebSocket-Key: ${req.headers["sec-websocket-key"]}` : null,
      req.headers["sec-websocket-version"] ? `Sec-WebSocket-Version: ${req.headers["sec-websocket-version"]}` : null,
      req.headers["sec-websocket-protocol"] ? `Sec-WebSocket-Protocol: ${req.headers["sec-websocket-protocol"]}` : null,
      "",
      "",
    ]
      .filter((l) => l !== null)
      .join("\r\n");
    const upSocket = net.connect(target.port, "127.0.0.1", () => {
      upSocket.write(upReq);
      if (head && head.length) upSocket.write(head);
    });
    upSocket.on("connect", () => {
      socket.pipe(upSocket);
    });
    upSocket.on("data", (chunk) => {
      socket.write(chunk);
    });
    upSocket.on("error", (err) => {
      console.error(`[gateway:${label}] ws ${target.prefix} error: ${err.message}`);
      socket.destroy();
    });
    socket.on("error", () => upSocket.destroy());
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[gateway:${label}] listening on http://localhost:${port}`);
    for (const p of prefixes) {
      const r = ROUTES.find((x) => x.prefix === p);
      console.log(`[gateway:${label}]   ${p}/ -> :${r.port}`);
    }
    if (root.redirect) {
      console.log(`[gateway:${label}]   / -> ${root.redirect}`);
    } else {
      console.log(`[gateway:${label}]   / -> ${root.label}:${root.port}`);
    }
  });
};

createGateway({
  port: WEB_GATEWAY_PORT,
  label: "web",
  prefixes: ["/cron/docs-json", "/cron/docs", "/admin/vditor", "/vditor", "/portal", "/owl", "/admin", "/cron"],
  root: { port: PORTAL_WEB_PORT, prefix: "/", label: "portal" },
});

createGateway({
  port: MOBILE_GATEWAY_PORT,
  label: "mobile",
  prefixes: [],
  root: { port: MOBILE_WEB_PORT, prefix: "/", label: "mobile-web" },
});
