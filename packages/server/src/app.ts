import express from "express";
import cors from "cors";
import generateRoute from "./routes/generate.route.js";
import healthRoute from "./routes/health.route.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/generate", generateRoute);
  app.use("/api/health", healthRoute);

  return app;
}
