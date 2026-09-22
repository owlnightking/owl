// 预览专用 PostCSS：显式指定 tailwind 配置（用共享预设 + 绝对 content 路径），
// 这样构建与 cwd 无关，也不会误用 app 自己的 postcss 配置。
const path = require("node:path");
const webPreset = require("../../../tailwind/web.cjs");

module.exports = {
  plugins: {
    tailwindcss: {
      config: {
        presets: [webPreset],
        content: [
          path.resolve(__dirname, "index.html"),
          path.resolve(__dirname, "*.tsx"),
          path.resolve(__dirname, "../src/pages/SampleListPage.tsx"),
        ],
      },
    },
    autoprefixer: {},
  },
};
