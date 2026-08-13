import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const cronPort = rootEnv.CRON_PORT ?? "3001";
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5175,
      proxy: {
        "/api": {
          target: `http://localhost:${cronPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
