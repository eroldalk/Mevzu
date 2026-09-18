import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "instagram-manual-publish-api",
      configureServer(server) {
        server.middlewares.use("/api/manual-publish", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Method not allowed" }));
          }

          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });

          req.on("end", async () => {
            try {
              const params = JSON.parse(body || "{}");
              const { manualRenderAndPublish } = await import("./scripts/manualPublishService.mjs");
              const result = await manualRenderAndPublish(params);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (err) {
              console.error("[API Error /api/manual-publish]:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        });
      },
    },
  ],
  base: "/",
  server: { port: 5174, strictPort: true },
});
