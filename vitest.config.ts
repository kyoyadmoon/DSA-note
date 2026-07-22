import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    exclude: [...configDefaults.exclude, ".claude/worktrees/**"],
  },
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
});
