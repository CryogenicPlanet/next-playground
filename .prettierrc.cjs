/** @type {import("prettier").Config} */
module.exports = {
  ...require("prettier-config-standard"),
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  tailwindConfig: "./packages/config/tailwind",
};
