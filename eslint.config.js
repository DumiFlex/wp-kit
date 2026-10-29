import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vue from "eslint-plugin-vue";
import a11y from "eslint-plugin-vuejs-accessibility";
import vueParser from "vue-eslint-parser";

// The same rules the Wildcard Pipeline extension lints these files with, so a
// piece that passes here passes in every app that pulls it in.

// A label may wrap its control or point at it with `for=`. WpCheck renders a
// <button role="checkbox">, which a wrapping <label> activates like an input.
const LABEL_HAS_FOR = { required: { some: ["nesting", "id"] }, controlComponents: ["WpCheck", "WpSelect", "WpNumber"] };

// typescript-eslint "strict" rules that need no type information.
const STRICTER_TS_RULES = {
  "@typescript-eslint/ban-ts-comment": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/no-empty-object-type": "error",
  "@typescript-eslint/no-unsafe-function-type": "error",
  "@typescript-eslint/no-wrapper-object-types": "error",
  "@typescript-eslint/no-extraneous-class": "error",
  "@typescript-eslint/no-namespace": "error",
};

const GENERAL_STRICT_RULES = {
  eqeqeq: ["error", "always", { null: "ignore" }],
  "prefer-const": "error",
  "no-var": "error",
  "no-console": ["warn", { allow: ["warn", "error", "info"] }],
};

export default [
  { ignores: ["node_modules/**", "dist/**", "coverage/**"] },
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      ...STRICTER_TS_RULES,
      ...GENERAL_STRICT_RULES,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser, ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { vue, "vuejs-accessibility": a11y, "@typescript-eslint": tsPlugin },
    // Makes `<!-- eslint-disable-next-line … -->` in templates work.
    processor: vue.processors[".vue"],
    rules: {
      ...vue.configs["vue3-recommended"].rules,
      "vue/comment-directive": "error",
      ...a11y.configs.recommended.rules,
      ...STRICTER_TS_RULES,
      ...GENERAL_STRICT_RULES,
      // Generic pieces have one-word names (Badge, Popover).
      "vue/multi-word-component-names": "off",
      "vuejs-accessibility/click-events-have-key-events": "warn",
      "vuejs-accessibility/no-static-element-interactions": "warn",
      "vuejs-accessibility/anchor-has-content": "error",
      "vuejs-accessibility/label-has-for": ["warn", LABEL_HAS_FOR],
      "vuejs-accessibility/interactive-supports-focus": "warn",
      "vuejs-accessibility/mouse-events-have-key-events": "warn",
    },
  },
];
