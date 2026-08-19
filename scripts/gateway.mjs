#!/usr/bin/env node
// gateway.mjs — 前端统一入口：同一路由域下按 /owl /admin /cron 前缀分发到各前端，
// /api 统一转发到 api-service（SSO 同域 cookie 前提）。支持 websocket（vite HMR）。
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

const GATEWAY_PORT = readEnvPort("GATEWAY_PORT", 5173);
const OWL_WEB_PORT = readEnvPort("OWL_WEB_PORT", 5273);
const ADMIN_WEB_PORT = readEnvPort("ADMIN_WEB_PORT", 5274);
const CRON_WEB_PORT = readEnvPort("CRON_WEB_PORT", 5275);
const MOBILE_WEB_PORT = readEnvPort("MOBILE_WEB_PORT", 5276);
const API_PORT = readEnvPort("API_PORT", 5100);

const ROUTES = [
  { prefix: "/owl", port: OWL_WEB_PORT },
  { prefix: "/admin", port: ADMIN_WEB_PORT },
  { prefix: "/cron", port: CRON_WEB_PORT },
  { prefix: "/m", port: MOBILE_WEB_PORT },
];

const findTarget = (url) => {
  const pathname = url.split("?")[0];
  if (pathname === "/" || pathname === "/owl") {
    return { redirect: "/owl/" };
  }
  if (pathname === "/admin") return { redirect: "/admin/" };
  if (pathname === "/cron") return { redirect: "/cron/" };
  if (pathname === "/m") return { redirect: "/m/" };
  for (const r of ROUTES) {
    if (pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)) {
      return { port: r.port, prefix: r.prefix };
    }
  }
  if (pathname.startsWith("/api")) {
    return { port: API_PORT, prefix: "/api" };
  }
  return { port: OWL_WEB_PORT, prefix: "/owl" };
};

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
    console.error(`[gateway] ${target.prefix} -> :${target.port} error: ${err.message}`);
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
    console.error(`[gateway] ws ${target.prefix} error: ${err.message}`);
    socket.destroy();
  });
  socket.on("error", () => upSocket.destroy());
});

server.listen(GATEWAY_PORT, "0.0.0.0", () => {
  console.log(`[gateway] listening on http://localhost:${GATEWAY_PORT}`);
  console.log(
    `[gateway]   / -> /owl/  /admin/ -> :${ADMIN_WEB_PORT}  /cron/ -> :${CRON_WEB_PORT}  /m/ -> :${MOBILE_WEB_PORT}`
  );
});
