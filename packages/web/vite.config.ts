import type { ServerResponse } from "node:http";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (err, _req, res) => {
            const out = res as ServerResponse | undefined;
            if (!out || out.headersSent || typeof out.writeHead !== "function")
              return;
            const msg = err instanceof Error ? err.message : String(err);
            out.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
            out.end(JSON.stringify({
              error: "API_UPSTREAM_UNAVAILABLE",
              message: "无法连接后端 http://127.0.0.1:3002。请在仓库根目录执行 pnpm server:dev，或执行 pnpm dev:all 同时启动前后端。",
              detail: msg,
            }));
          });
        },
      },
    },
  },
  preview: {
    port: 5173,
  },
});
