const { nativewindPreset } = require("@openingshq/design-tokens/nativewind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset"), nativewindPreset],
};
