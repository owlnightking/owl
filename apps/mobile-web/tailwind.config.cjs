const spacing = {};
const step = 0.08;
for (let i = 0; i <= 96; i++) {
  spacing[i] = `${i * step}rem`;
}
spacing["px"] = "1px";

module.exports = {
  content: ["./index.html", "src/**/*.{ts,tsx}"],
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
