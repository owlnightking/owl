const mobilePreset = require("../../tailwind/mobile.cjs");

module.exports = {
  presets: [mobilePreset],
  content: ["./index.html", "src/**/*.{ts,tsx}"],
};
