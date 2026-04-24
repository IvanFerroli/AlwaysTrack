module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/", "build/", "node_modules/"],
  overrides: [
    {
      files: ["apps/**/*.ts", "services/**/*.ts", "packages/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
        ]
      }
    }
  ]
};
