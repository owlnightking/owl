/**
 * mobile 端设计基线 —— mobile-web 专用
 *
 * 与 web 端基线刻意分开：两端的尺寸体系（rem 等比适配 vs px）与 UI 库
 * （@arco-design/mobile-react vs @arco-design/web-react）都不同，不能共用同一套 token。
 *
 * 尺寸体系：移动端以 rem 做等比适配，html font-size = 50px（见 apps/mobile-web/src/index.css）。
 * spacing 以 0.08rem 为步长生成 0..96（覆盖 0 到 7.68rem），字号与圆角按 rem 固定，
 * 目的是让页面只从这套刻度取值，不要各页面自行发明尺寸。
 *
 * 内容与本文件拆分前 mobile-web/tailwind.config.cjs 完全一致（逐字节等价的 CSS 产物已校验）。
 */
const spacing = {};
const step = 0.08;
for (let i = 0; i <= 96; i++) {
  spacing[i] = `${i * step}rem`;
}
spacing["px"] = "1px";

module.exports = {
  theme: {
    spacing,
    fontSize: {
      xs: ["0.24rem", { lineHeight: "0.32rem" }],
      sm: ["0.28rem", { lineHeight: "0.4rem" }],
      base: ["0.32rem", { lineHeight: "0.48rem" }],
      lg: ["0.36rem", { lineHeight: "0.56rem" }],
      xl: ["0.4rem", { lineHeight: "0.56rem" }],
      "2xl": ["0.48rem", { lineHeight: "0.64rem" }],
      "3xl": ["0.6rem", { lineHeight: "0.72rem" }],
      "4xl": ["0.72rem", { lineHeight: "0.8rem" }],
    },
    extend: {
      borderRadius: {
        lg: "0.12rem",
        xl: "0.2rem",
        "2xl": "0.24rem",
        "3xl": "0.28rem",
      },
    },
  },
  plugins: [],
};
