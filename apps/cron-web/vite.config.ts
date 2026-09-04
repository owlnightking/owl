import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import qiankun from "vite-plugin-qiankun";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const apiPort = rootEnv.API_PORT ?? "5100";
  const cronPort = rootEnv.CRON_PORT ?? "5101";
  return {
    base: "/cron/",
    plugins: [
      react(),
      qiankun("cron", {
        useDevMode: true,
      }),
    ],
    server: {
      host: "0.0.0.0",
      port: Number(rootEnv.CRON_WEB_PORT ?? 5275),
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        "/cron/health": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
        "/cron/schedulers": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
        "/cron/task-queue": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
        "/cron/sync-logs": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
