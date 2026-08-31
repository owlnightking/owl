import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const apiPort = rootEnv.API_PORT ?? "3000";
  const adminPort = rootEnv.ADMIN_WEB_PORT ?? "5274";
  const owlPort = rootEnv.OWL_WEB_PORT ?? "5273";
  const cronPort = rootEnv.CRON_WEB_PORT ?? "5275";
  return {
    base: "/",
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: Number(rootEnv.PORTAL_WEB_PORT ?? 5270),
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        "/admin/": {
          target: `http://localhost:${adminPort}`,
          changeOrigin: true,
        },
        "/owl/": {
          target: `http://localhost:${owlPort}`,
          changeOrigin: true,
        },
        "/cron/": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
