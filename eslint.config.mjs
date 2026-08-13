import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/generated/**", "**/*.mjs", "**/*.js"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        sourceType: "module",
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: ["apps/*/src/main.ts"],
    rules: {
      "no-console": "off",
    },
  }
);
