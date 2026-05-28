import { readFileSync } from "node:fs";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

/** @lineiconshq/* ships sourceMappingURL comments but no .map files — Vite 8 SSR warns on ENOENT. */
function stripLineiconsSourcemapRefs(): Plugin {
  const lineicons = /[/\\]@lineiconshq[/\\](free-icons|react-lineicons)[/\\]/;
  return {
    name: "strip-lineicons-sourcemap-refs",
    enforce: "pre",
    load(id) {
      if (!lineicons.test(id) || !id.endsWith(".js")) return;
      const code = readFileSync(id, "utf-8");
      if (!code.includes("sourceMappingURL")) return;
      return code.replace(/\/\/# sourceMappingURL=.*$/gm, "");
    },
  };
}

export default defineConfig({
  plugins: [stripLineiconsSourcemapRefs(), tailwindcss(), reactRouter()],
  server: {
    port: 5175,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Package "main" is CJS but package.json has "type":"module" — breaks SSR.
      "@lineiconshq/free-icons": "@lineiconshq/free-icons/dist/index.esm.js",
      "@lineiconshq/react-lineicons":
        "@lineiconshq/react-lineicons/dist/index.esm.js",
    },
  },
});
