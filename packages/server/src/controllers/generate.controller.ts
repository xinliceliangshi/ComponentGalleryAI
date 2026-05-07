import type { Request, Response } from "express";
import { generateService } from "../services/generate.service.js";

export async function generateController(req: Request, res: Response) {
  try {
    const { input } = req.body as { input?: string };

    if (!input) {
      return res.status(400).json({ error: "input required" });
    }

    const result = await generateService(input);

    res.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({
      error: "GENERATE_FAILED",
      message
    });
  }
}
