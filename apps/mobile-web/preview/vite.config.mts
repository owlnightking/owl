// 样板页预览构建配置：以 apps/mobile-web 为 cwd 运行
//   cd apps/mobile-web && npx vite build --config preview/vite.config.mts
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appDir = process.cwd();

export default defineConfig({
  root: path.join(appDir, "preview"),
  base: "./",
  plugins: [react()],
  build: {
    outDir: path.resolve(appDir, "../../preview/mobile"),
    emptyOutDir: true,
  },
});
