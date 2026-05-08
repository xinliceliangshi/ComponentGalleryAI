import antfu from "@antfu/eslint-config";

export default antfu(
  {
    vue: true,
    typescript: true,
    formatters: false,
    stylistic: {
      quotes: "double",
      semi: true,
    },
  },
  {
    rules: {
      "no-console": "off",
    },
  },
);
