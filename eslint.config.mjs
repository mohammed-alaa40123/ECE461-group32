import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  security.configs.recommended,
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint
    },

    languageOptions: {
      globals: {},
      parser: tsParser,
      ecmaVersion: 12,
      sourceType: "module"
    },

    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "off", // Allows any
      "@typescript-eslint/no-namespace": "off", // Allows namespace,
      "prefer-const": "off",
      "security/detect-object-injection": "off",
      "no-useless-escape": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-case-declarations": "off",
      "no-unreachable": "off",
    }
  },
  {
    ignores: ["repos", "backend/src/index.js", "backend/src/webpack.config.js",]
  },
  {
    files: ["backend/src/handlers/__tests__/**/*"],
    rules: {
      "security/detect-non-literal-fs-filename": "off"
    }
  }
];
