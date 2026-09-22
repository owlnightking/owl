const webPreset = require("../../tailwind/web.cjs");

module.exports = {
  presets: [webPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
