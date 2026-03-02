import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react-hook-form",
    "@fluentui/react",
    "@fluentui/react-hooks",
    "@brhanso/dynamic-forms-core",
  ],
  jsx: "automatic",
});
