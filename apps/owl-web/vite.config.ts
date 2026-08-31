import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import qiankun from "vite-plugin-qiankun";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const apiPort = rootEnv.API_PORT ?? "3000";
  return {
    base: "/owl/",
    plugins: [
      react(),
      qiankun("owl", {
        useDevMode: true,
      }),
    ],
    server: {
      host: "0.0.0.0",
      port: Number(rootEnv.OWL_WEB_PORT ?? 5273),
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
