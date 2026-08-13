import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const apiPort = rootEnv.API_PORT ?? "3000";
  return {
    base: "/admin/",
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: Number(rootEnv.ADMIN_WEB_PORT ?? 5274),
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
