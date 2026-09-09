import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { vditorPlugin } from "../../scripts/vite-plugins/vditor-serve";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const apiPort = rootEnv.API_PORT ?? "3000";
  return {
    base: "/mobile/",
    plugins: [react(), vditorPlugin()],
    server: {
      host: "0.0.0.0",
      port: Number(rootEnv.MOBILE_WEB_PORT ?? 5276),
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
