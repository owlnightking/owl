/**
 * web 端设计基线 —— admin-web / owl-web / cron-web / portal 四个 web 应用共用
 *
 * 风格统一机制：各 app 的 tailwind.config.cjs 只保留自己的 content 与对本文件的 presets 引用。
 * 任何设计 token（颜色 / 圆角 / 字号 / 阴影 / 字体）都只在本文件改一次，四个 web 端同时生效，
 * 不存在「改了 3 个漏了 1 个」的漂移。各 app 禁止自行声明 theme / plugins，
 * 由 scripts/check-frontend-rules.sh 第 9 条校验。
 *
 * 语义色：新增代码优先使用语义名，不要直接写 blue-* / red-* 等原始色阶，
 * 这样将来换品牌色只需改本文件。当前取值等同 Tailwind 默认色板，故存量页面（用的都是 blue-* 等）
 * 不受影响；语义色在页面采用之前不会产出任何 CSS。
 *
 * 中性色与形态的既有约定（新增页面沿用，勿发明新值）：
 *   主文本 text-gray-800 ｜ 次文本 text-gray-500 / gray-600 ｜ 弱化 text-gray-400
 *   页面底色 bg-gray-50 ｜ 卡片 bg-white ｜ 分割线 border-gray-100 / gray-200
 *   圆角 rounded-lg / rounded-xl ｜ 阴影 shadow-sm
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        warning: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
      },
    },
  },
  plugins: [],
};
