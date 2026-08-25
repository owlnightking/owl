import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import qiankun from "vite-plugin-qiankun";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const cronPort = rootEnv.CRON_PORT ?? "3001";
  return {
    base: "/cron/",
    plugins: [
      react(),
      qiankun("cron", {
        useDevMode: true,
      }),
    ],
    server: {
      host: "127.0.0.1",
      port: Number(rootEnv.CRON_WEB_PORT ?? 5275),
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        "/api": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
