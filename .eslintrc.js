module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["@programic/eslint-config-typescript", "prettier"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "no-bitwise": "off",
    "no-param-reassign": "off",
    "id-length": "off",
    "prefer-const": "error",
    "no-const-assign": "error",
    "quotes": "off",
    "@typescript-eslint/quotes": [
      "warn",
      "double",
      {
        allowTemplateLiterals: true,
      },
    ],
    "prettier/prettier": ["error"],
    "import/prefer-default-export": "off", // Allow single Named-export
    "unicorn/prevent-abbreviations": "warn"
  }
};
